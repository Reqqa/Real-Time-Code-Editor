import { useEffect, useRef, useCallback } from "react";

interface Options {
  user: string;
  room: string;
  onEdit: (content: string, fromUser: string) => void;
  onUserJoin: (user: string) => void;
  onUserLeave: (user: string) => void;
}

export function useCollabSocket({ user, room, onEdit, onUserJoin, onUserLeave }: Options) {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080/ws");

    ws.current.onopen = () => {
      ws.current?.send(JSON.stringify({ type: "join", user, room }));
    };

    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "edit")  onEdit(msg.content, msg.user);
      if (msg.type === "join")  onUserJoin(msg.user);
      if (msg.type === "leave") onUserLeave(msg.user);
    };

    return () => ws.current?.close();
  }, []);

  const sendEdit = useCallback((content: string) => {
    ws.current?.send(JSON.stringify({ type: "edit", user, content, cursor: 0 }));
  }, [user]);

  return { sendEdit };
}