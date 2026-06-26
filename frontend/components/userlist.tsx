export default function UserList({ users }: { users: string[] }) {
  return (
    <div className="flex gap-2 p-2 bg-zinc-900 border-b border-zinc-700">
      {users.map((u) => (
        <span
          key={u}
          className="px-2 py-1 bg-zinc-700 rounded text-xs text-white"
        >
          {u}
        </span>
      ))}
    </div>
  );
}
