use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
    routing::get,
    Router,
};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};

// Defining a placeholder struct for your state so the code compiles.
#[derive(Clone)]
struct AppState {
    // Add your shared rooms data structure here (e.g., Arc<Mutex<...>>)
    rooms_placeholder: String,
}

#[tokio::main]
async fn main() {
    // 1. Initialize your state
    let rooms = AppState {
        rooms_placeholder: "Room Data".to_string(),
    };

    // 2. Setup CORS middleware
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // 3. Build the router with CORS and State
    let app = Router::new()
        .route("/ws", get(ws_handler))
        .layer(cors)
        .with_state(Arc::new(rooms)); // Wrapping in Arc for thread-safe sharing

    // 4. Bind and run the server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080")
        .await
        .unwrap();

    println!("Listening on port 8080");

    axum::serve(listener, app).await.unwrap();
}

// The handler extracts both the WS upgrade request and your application state
async fn ws_handler(
    ws: WebSocketUpgrade,
    State(_state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: WebSocket) {
    while let Some(Ok(msg)) = socket.recv().await {
        if let Message::Text(text) = msg {
            println!("Received: {text}");
            
            // Echo the message back to the client
            if socket.send(Message::Text(format!("echo: {text}").into())).await.is_err() {
                // Client disconnected
                break;
            }
        }
    }
}