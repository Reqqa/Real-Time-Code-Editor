use tokio::sync::broadcast;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex; 
use crate::messages::BroadcastPayload;

// 1. Cleaned up Type Alias
pub type RoomMap = Arc<Mutex<AppState>>;

// 2. Updated to properly use your AppState structure
pub async fn get_or_create_room(
    rooms: &RoomMap,
    room_id: &str,
) -> broadcast::Sender<BroadcastPayload> {
    let mut state = rooms.lock().await; 
    
    // Instead of calling .entry() on the struct itself, call your helper method!
    state.get_or_create_channel(room_id)
}

pub struct AppState {
    // 3. Fixed: Changed String to BroadcastPayload so it matches ws_handler
    pub channels: HashMap<String, broadcast::Sender<BroadcastPayload>>, 
    pub documents: HashMap<String, String>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            channels: HashMap::new(),
            documents: HashMap::new(),
        }
    }

    // 4. Fixed: Updated return type to match BroadcastPayload
    pub fn get_or_create_channel(
        &mut self,
        room_id: &str,
    ) -> broadcast::Sender<BroadcastPayload> {
        self.channels
            .entry(room_id.to_string())
            .or_insert_with(|| broadcast::channel(64).0)
            .clone()
    }

    pub fn get_document(&self, room_id: &str) -> String {
        println!("Client requesting snapshot for room: '{}'", room_id);
        println!("Current saved rooms: {:?}", self.documents.keys());
        self.documents
            .get(room_id)
            .cloned()
            .unwrap_or_default()
    }

    pub fn save_document(&mut self, room_id: &str, content: String) {
        self.documents.insert(room_id.to_string(), content);
    }
}