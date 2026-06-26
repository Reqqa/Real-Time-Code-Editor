use crate::messages::{BroadcastPayload, ClientMessage, ServerMessage};
use crate::room::RoomMap;
use axum::extract::State;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::response::IntoResponse;
use futures::{SinkExt, StreamExt};

pub async fn ws_handler(ws: WebSocketUpgrade, State(rooms): State<RoomMap>) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, rooms))
}

async fn handle_socket(socket: WebSocket, state: RoomMap) {
    let (mut ws_send, mut ws_recv) = socket.split();

    // ── Step 1: wait for Join message ─────────────────────────────────────
    let (room_id, username) = loop {
        match ws_recv.next().await {
            Some(Ok(Message::Text(text))) => {
                println!("Raw string received on startup: {}", text);
                match serde_json::from_str::<ClientMessage>(&text) {
                    Ok(ClientMessage::Join { user, room }) => {
                        println!("Join successful! User '{}' joined room '{}'", user, room);
                        break (room, user);
                    }
                    Err(e) => {
                        println!("Serde failed to parse Join message: {:?}", e);
                    }
                    _ => continue,
                }
            }
            _ => return,
        }
    };

    let client_numeric_id = fxhash::hash64(&username);

    // ── Step 2: get channel + snapshot, announce join ──────────────────────
    let (tx, snapshot) = {
        let mut s = state.lock().await;
        let tx = s.get_or_create_channel(&room_id);
        let snapshot = s.get_document(&room_id);
        (tx, snapshot)
    };

    // Send snapshot privately to the newly joined client
    let snap_inner = serde_json::to_string(&ServerMessage::Snapshot { content: snapshot }).unwrap();
    let snap_msg = serde_json::to_string(&BroadcastPayload {
        sender_id: 0, // 0 = system/server
        text: snap_inner,
    })
    .unwrap();
    if ws_send.send(Message::Text(snap_msg)).await.is_err() {
        return;
    }

    // Announce to the room that someone joined
    let joined_msg = serde_json::to_string(&ServerMessage::Joined {
        user: username.clone(),
    })
    .unwrap();
    let _ = tx.send(BroadcastPayload {
        sender_id: client_numeric_id,
        text: joined_msg,
    });

    let mut rx = tx.subscribe();

    // ── Step 3: outbound task — broadcast channel → this client ───────────
    // FIX: was incorrectly reading ws_recv here instead of forwarding from rx
    let mut send_task = tokio::spawn(async move {
        while let Ok(payload) = rx.recv().await {
            println!("Forwarding broadcast to client: {}", payload.text);
            if ws_send.send(Message::Text(payload.text)).await.is_err() {
                break;
            }
        }
    });

    // ── Step 4: inbound task — this client → save + broadcast ─────────────
    // FIX: recv_task and select! were nested inside send_task's closure; moved out
    let state_clone = state.clone();
    let room_clone = room_id.clone();
    let user_clone = username.clone();
    let tx_clone = tx.clone();

    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(Message::Text(text))) = ws_recv.next().await {
            println!("✏️ Raw incoming string while typing: {}", text);
            match serde_json::from_str::<ClientMessage>(&text) {
                Ok(ClientMessage::Edit {
                    content, cursor, ..
                }) => {
                    println!(" Handling Edit from '{}'!", user_clone);
                    {
                        let mut s = state_clone.lock().await;
                        s.save_document(&room_clone, content.clone());
                    }
                    let out = serde_json::to_string(&ServerMessage::Edit {
                        user: user_clone.clone(),
                        content,
                        cursor,
                    })
                    .unwrap();
                    let _ = tx_clone.send(BroadcastPayload {
                        sender_id: client_numeric_id,
                        text: out,
                    });
                }
                Ok(ClientMessage::Leave { .. }) => break,
                Err(e) => {
                    println!("Serde failed to parse Edit message: {:?}", e);
                }
                _ => {}
            }
        }

        // Client disconnected — announce to the room
        let left_msg = serde_json::to_string(&ServerMessage::Left { user: user_clone }).unwrap();
        let _ = tx_clone.send(BroadcastPayload {
            sender_id: client_numeric_id,
            text: left_msg,
        });
    });

    // ── Step 5: if either task ends, abort the other ───────────────────────
    tokio::select! {
        _ = &mut send_task => recv_task.abort(),
        _ = &mut recv_task => send_task.abort(),
    }
}
