use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
// The Client Message can only be Join, Edit , Cursor and Leave 
pub enum ClientMessage {
    Join   { user: String, room: String },
    Edit   { user: String, content: String, cursor: usize },
    Cursor { user: String, position: usize },
    Leave  { user: String },
}