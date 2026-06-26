//main.rs file
mod messages;
mod room;
mod ws_handler;

use axum::{Router, routing::get};
use room::RoomMap;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};
use ws_handler::ws_handler;

use crate::room::AppState;

#[tokio::main]
async fn main() {
    let rooms: RoomMap = Arc::new(Mutex::new(AppState::new()));

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .layer(cors)
        .with_state(rooms);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();

    println!("Listening on port 8080");
    axum::serve(listener, app).await.unwrap();
}
