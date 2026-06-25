"use client";
import { useState } from "react";
import Editor from "@/components/editor";
import UserList from "@/components/userlist";
import { useCollabSocket } from "@/components/useCollabSocket";

export default function Page() {
  const [code, setCode] = useState("fn main() {\n    println!(\"Hello!\");\n}");
  const [users, setUsers] = useState<string[]>(["alice"]);

  const { sendEdit } = useCollabSocket({
    user: "alice",
    room: "room1",
    onEdit: (content) => setCode(content),
    onUserJoin:  (u) => setUsers((prev) => [...new Set([...prev, u])]),
    onUserLeave: (u) => setUsers((prev) => prev.filter((x) => x !== u)),
  });

  return (
    <main className="h-screen flex flex-col bg-zinc-950">
      <UserList users={users} />
      <Editor
        value={code}
        onChange={(val) => {
          setCode(val);
          sendEdit(val); // ← broadcast to other tabs
        }}
      />
    </main>
  );
}