import type { Profile } from "@/lib/auth/users";
import UserRow from "./UserRow";

export default function UserList({
  users,
  currentUserId,
}: {
  users: Profile[];
  currentUserId: string;
}) {
  return (
    <div className="settings-list">
      {users.map((user) => (
        <UserRow key={user.id} user={user} isSelf={user.id === currentUserId} />
      ))}
    </div>
  );
}
