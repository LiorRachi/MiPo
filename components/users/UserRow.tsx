"use client";

import { useState } from "react";
import type { Profile } from "@/lib/auth/users";
import UserSheet from "./UserSheet";

export default function UserRow({
  user,
  isSelf,
}: {
  user: Profile;
  isSelf: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`settings-row settings-nav-row${user.role === "admin" ? " settings-row-admin" : ""}`}
        onClick={() => setEditOpen(true)}
      >
        <span className="settings-nav-label">{user.display_name}</span>
        {user.role === "admin" && <span className="admin-pill">מנהל</span>}
        <span className="settings-nav-chevron">›</span>
      </button>

      <UserSheet
        mode="edit"
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => setEditOpen(false)}
        user={user}
        isSelf={isSelf}
      />
    </>
  );
}
