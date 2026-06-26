"use client";
import { useState, useRef } from "react";
import Editor from "@/components/editor";
import UserList from "@/components/userlist";
import { useCollabSocket } from "@/components/useCollabSocket";

export default function Page() {
  const [code, setCode] = useState('fn main() {\n    println!("Hello!");\n}');
  const [users, setUsers] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);

  const isIncomingUpdate = useRef(false);

  const { sendEdit } = useCollabSocket({
    user: username,
    room: "room1",
    onSnapshot: (content) => {
      isIncomingUpdate.current = true;
      setCode(content);
    },
    onEdit: (content) => {
      isIncomingUpdate.current = true;
      setCode(content);
    },
    onUserJoin: (u) => setUsers((prev) => [...new Set([...prev, u])]),
    onUserLeave: (u) => setUsers((prev) => prev.filter((x) => x !== u)),
  });

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) setJoined(true);
  };

  if (!joined) {
    return (
      <main className="h-screen flex items-center justify-center bg-zinc-950">
        <form onSubmit={handleJoin} className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="px-3 py-2 rounded bg-zinc-800 text-white"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded bg-blue-600 text-white"
          >
            Join
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-zinc-950">
      <UserList users={users} />
      <Editor
        value={code}
        onChange={(val) => {
          if (isIncomingUpdate.current) {
            isIncomingUpdate.current = false;
            return;
          }
          setCode(val);
          sendEdit(val);
        }}
      />
    </main>
  );
}
