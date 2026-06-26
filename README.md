# Real-Time-Code-Editor

The codebase for the Real-Time Code Editor is structured into a client-server architecture with a Rust backend and a Next.js (React/TypeScript) frontend.

### System Overview

*   **Backend:** This is a Rust application leveraging the `axum` web framework, with a strong emphasis on real-time communication via WebSockets. It uses `tokio` for asynchronous operations, `serde` for data serialization/deserialization, and `tower-http` for handling HTTP utilities, including CORS. The `fxhash` crate suggests efficient hashing might be used for data management.
*   **Frontend:** This is a Next.js application, built with React and TypeScript. It uses Tailwind CSS for styling. The `package.json` indicates standard Next.js, React, and TypeScript dependencies. While no explicit WebSocket client library is listed, the frontend is expected to use native WebSocket APIs or a lightweight wrapper to communicate with the backend.

### How the System Works

1.  **Connection Establishment:** When a user accesses the frontend application in their browser, the Next.js client initiates a WebSocket connection to the Rust backend.
2.  **Real-Time Communication:** This WebSocket connection provides a persistent, bidirectional channel for communication.
3.  **Code Synchronization:** As users make changes in the frontend's code editor, these modifications are captured and sent as data (e.g., diffs or updates) over the WebSocket to the backend.
4.  **Broadcast and Update:** The backend receives these changes, processes them, and then broadcasts the updates to all other clients connected to the same editing session.
5.  **Collaborative Editing:** Each connected frontend receives the broadcasted changes and applies them to its local editor, allowing all participants to see code updates in real-time, facilitating collaborative editing.

### Features to be added
1.  **Multiple Users:** when local host opens users are needed to give a prompt of their name so the backend can identify them and appear in the list of connected users.
2.  **Seperate Rooms/Workspaces:** When a user joins, they are prompted to enter a room or workspace name, which is used to group them with other users editing the same codebase.
