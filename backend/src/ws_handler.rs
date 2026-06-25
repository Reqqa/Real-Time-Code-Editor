use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
};
use futures_util::{sink::SinkExt, stream::StreamExt};
use std::sync::atomic::{AtomicU64, Ordering};
use tokio::sync::{broadcast, mpsc};

use crate::messages::{BroadcastPayload, ClientMessage};
use crate::room::{get_or_create_room, RoomMap};

static NEXT_USER_ID: AtomicU64 = AtomicU64::new(1);

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(rooms): State<RoomMap>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, rooms))
}

async fn handle_socket(socket: WebSocket, rooms: RoomMap) {
    let client_id = NEXT_USER_ID.fetch_add(1, Ordering::Relaxed);
    let (mut ws_sender, mut receiver) = socket.split();

    // ── Fix: use an mpsc channel so ws_sender is owned by ONE task forever.
    //    Previously, ws_sender was moved into tokio::spawn on the first Join,
    //    making it impossible to handle a second Join or any reconnect.
    let (out_tx, mut out_rx) = mpsc::channel::<String>(32);

    // This task owns ws_sender exclusively — no move conflict on re-join
    tokio::spawn(async move {
        while let Some(text) = out_rx.recv().await {
            if ws_sender.send(Message::Text(text)).await.is_err() {
                break;
            }
        }
    });

    let mut tx: Option<broadcast::Sender<BroadcastPayload>> = None;
    let mut rx_task: Option<tokio::task::JoinHandle<()>> = None;

    while let Some(Ok(Message::Text(text))) = receiver.next().await {
        if let Ok(msg) = serde_json::from_str::<ClientMessage>(&text) {
            match msg {
                ClientMessage::Join { room, .. } => {
                    // Abort previous broadcast listener if switching rooms
                    if let Some(task) = rx_task.take() {
                        task.abort();
                    }

                    let channel_tx = get_or_create_room(&rooms, &room);
                    let mut channel_rx = channel_tx.subscribe();
                    tx = Some(channel_tx);

                    // Clone out_tx so the spawn can forward to ws_sender task
                    let out_tx_clone = out_tx.clone();

                    rx_task = Some(tokio::spawn(async move {
                        while let Ok(payload) = channel_rx.recv().await {
                            if payload.sender_id != client_id {
                                if out_tx_clone.send(payload.text).await.is_err() {
                                    break;
                                }
                            }
                        }
                    }));
                }

                ClientMessage::Edit { .. }
                | ClientMessage::Cursor { .. }
                | ClientMessage::Leave { .. } => {
                    if let Some(ref t) = tx {
                        let payload = BroadcastPayload {
                            sender_id: client_id,
                            text: text.to_string(),
                        };
                        let _ = t.send(payload);
                    }
                }
            }
        }
    }

    if let Some(task) = rx_task {
        task.abort();
    }
}