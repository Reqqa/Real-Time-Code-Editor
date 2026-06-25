use tokio::sync::broadcast;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

pub type RoomMap = Arc<Mutex<HashMap<String, broadcast::Sender<String>>>>;

pub fn get_or_create_room(
    rooms: &RoomMap,
    room_id: &str,
) -> broadcast::Sender<String> {
    let mut map = rooms.lock().unwrap();
    map.entry(room_id.to_string())
        .or_insert_with(|| broadcast::channel(64).0)
        .clone()
}