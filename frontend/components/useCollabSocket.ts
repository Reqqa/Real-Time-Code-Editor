import { useEffect, useRef, useCallback } from "react";

interface Options {
  user: string;
  room: string;
  onSnapshot: (content: string) => void;
  onEdit: (content: string, fromUser: string) => void;
  onUserJoin: (user: string) => void;
  onUserLeave: (user: string) => void;
}

export function useCollabSocket({
  user,
  room,
  onSnapshot,
  onEdit,
  onUserJoin,
  onUserLeave,
}: Options) {
  const ws = useRef<WebSocket | null>(null);

  // Store callbacks in a mutable ref to completely bypass React loop reconnect traps
  const callbacks = useRef({ onSnapshot, onEdit, onUserJoin, onUserLeave });

  useEffect(() => {
    callbacks.current = { onSnapshot, onEdit, onUserJoin, onUserLeave };
  });

  useEffect(() => {
    // Establish connection to backend
    ws.current = new WebSocket("ws://localhost:8080/ws");

    ws.current.onopen = () => {
      console.log(" WS Connected! Sending Join payload...");
      // Internal tag payload style matching your Rust enum macro attribute
      ws.current?.send(JSON.stringify({ type: "join", user, room }));
    };

    ws.current.onmessage = (e) => {
      try {
        const parsedData = JSON.parse(e.data);
        let msg;

        // Handle potential wrapper text layers safely
        if (
          parsedData &&
          typeof parsedData === "object" &&
          "text" in parsedData
        ) {
          msg = JSON.parse(parsedData.text);
        } else {
          msg = parsedData;
        }

        // FIX: Match the internal layout (`msg.type`) instead of external object keys!
        if (msg.type === "snapshot") {
          callbacks.current.onSnapshot(msg.content);
        }
        if (msg.type === "edit") {
          callbacks.current.onEdit(msg.content, msg.user);
        }
        if (msg.type === "joined") {
          callbacks.current.onUserJoin(msg.user);
        }
        if (msg.type === "leave" || msg.type === "left") {
          callbacks.current.onUserLeave(msg.user);
        }
      } catch (err) {
        console.error("Websocket routing breakdown:", err);
      }
    };

    return () => {
      ws.current?.close();
    };
    // The connection lifecycle is tied explicitly to changing user names or switching rooms
  }, [user, room]);

  const sendEdit = useCallback(
    (content: string) => {
      console.log("Attempting to send raw string over WS:", content);
      // Internal tag payload styling matches ClientMessage::Edit enum spec configuration
      ws.current?.send(
        JSON.stringify({ type: "edit", user, content, cursor: 0 }),
      );
    },
    [user],
  );

  return { sendEdit };
}
