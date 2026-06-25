use axum::{
    extract::{ws::{Message, WebSocket, WebSocketUpgrade}, State},
    response::IntoResponse,
};
use futures_util::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicU64, Ordering};

// Global counter to give every connection a unique ID
static NEXT_USER_ID: AtomicU64 = AtomicU64::new(1);

// Wrap your broadcast payloads to track who sent them
#[derive(Clone, Serialize, Deserialize)]
pub struct BroadcastPayload {
    pub sender_id: u64,
    pub text: String,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(rooms): State<RoomMap>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, rooms))
}

async fn handle_socket(socket: WebSocket, rooms: RoomMap) {
    let client_id = NEXT_USER_ID.fetch_add(1, Ordering::Relaxed);
    let (mut sender, mut receiver) = socket.split();
    
    let mut tx: Option<broadcast::Sender<BroadcastPayload>> = None;
    let mut rx_task: Option<tokio::task::JoinHandle<()>> = None;

    while let Some(Ok(Message::Text(text))) = receiver.next().await {
        if let Ok(msg) = serde_json::from_str::<ClientMessage>(&text) {
            match &msg {
                ClientMessage::Join { room, .. } => {
                    // Abort previous receiver task if client changes rooms
                    if let Some(task) = rx_task.take() {
                        task.abort();
                    }

                    let channel_tx = get_or_create_room(&rooms, room);
                    let mut channel_rx = channel_tx.subscribe();
                    tx = Some(channel_tx);

                    // Task 1 fixed: Spawn ONLY after rx is safely initialized
                    rx_task = Some(tokio::spawn(async move {
                        while let Ok(payload) = channel_rx.recv().await {
                            // SKIP sending back to the user who created it
                            if payload.sender_id != client_id {
                                let _ = sender.send(Message::Text(payload.text)).await;
                            }
                        }
                    }));
                }
                _ => {
                    if let Some(ref t) = tx {
                        // Pack sender_id with the text to broadcast
                        let payload = BroadcastPayload {
                            sender_id: client_id,
                            text,
                        };
                        let _ = t.send(payload);
                    }
                }
            }
        }
    }

    // Clean up the outbound task when client disconnects
    if let Some(task) = rx_task {
        task.abort();
    }
}
