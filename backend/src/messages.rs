use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClientMessage {
    Join   { user: String, room: String },
    Edit   { user: String, content: String, cursor: usize },
    Cursor { user: String, position: usize },
    Leave  { user: String },
}

// Moved here so both room.rs and ws_handler.rs can import it from one place
#[derive(Clone, Serialize, Deserialize)]
pub struct BroadcastPayload {
    pub sender_id: u64,
    pub text: String,
}