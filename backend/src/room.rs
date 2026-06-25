use tokio::sync::broadcast;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use crate::messages::BroadcastPayload;

// Was: broadcast::Sender<String> — mismatched with ws_handler
pub type RoomMap = Arc<Mutex<HashMap<String, broadcast::Sender<BroadcastPayload>>>>;

pub fn get_or_create_room(
    rooms: &RoomMap,
    room_id: &str,
) -> broadcast::Sender<BroadcastPayload> {
    let mut map = rooms.lock().unwrap();
    map.entry(room_id.to_string())
        .or_insert_with(|| broadcast::channel(64).0)
        .clone()
}