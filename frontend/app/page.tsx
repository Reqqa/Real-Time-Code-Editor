"use client";
import { useState } from "react";
import Editor from "@/components/editor";
import UserList from "@/components/userlist";

export default function Page() {
  const [code, setCode] = useState("fn main() {\n    println!(\"Hello!\");\n}");
  const users = ["alice", "bob"]; // hard-coded for now

  return (
    <main className="h-screen flex flex-col bg-zinc-950">
      <UserList users={users} />
      <Editor value={code} onChange={setCode} />
    </main>
  );
}