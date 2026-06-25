"use client";
import { useState, useRef } from "react";
import Editor from "@/components/editor";
import UserList from "@/components/userlist";
import { useCollabSocket } from "@/components/useCollabSocket";

export default function Page() {
  const [code, setCode] = useState("fn main() {\n    println!(\"Hello!\");\n}");
  const [users, setUsers] = useState<string[]>(["alice"]);
  
  // Use a ref to keep track of what the editor *thinks* the content currently is
  const isIncomingUpdate = useRef(false);

  const { sendEdit } = useCollabSocket({
    user: "alice",
    room: "room1",
    onSnapshot: (content) => {
      isIncomingUpdate.current = true;
      setCode(content);
    },
    onEdit: (content) => {
      // Flag that this state change comes from the network, NOT user typing
      isIncomingUpdate.current = true;
      setCode(content);
    },
    onUserJoin:  (u) => setUsers((prev) => [...new Set([...prev, u])]),
    onUserLeave: (u) => setUsers((prev) => prev.filter((x) => x !== u)),
  });

  return (
    <main className="h-screen flex flex-col bg-zinc-950">
      <UserList users={users} />
      <Editor
        value={code}
        onChange={(val) => {
          // If this onChange was triggered by an incoming network edit, 
          // just lower the flag and DO NOT send it back over the WebSocket.
          if (isIncomingUpdate.current) {
            isIncomingUpdate.current = false;
            return;
          }

          setCode(val);
          sendEdit(val); // Only broadcasts when the user physically types!
        }}
      />
    </main>
  );
}