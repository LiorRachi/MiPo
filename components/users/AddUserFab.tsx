"use client";

import { useState } from "react";
import UserSheet from "./UserSheet";

export default function AddUserFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="fab" onClick={() => setOpen(true)} aria-label="הוספת משתמש">
        +
      </button>

      <UserSheet
        mode="add"
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => setOpen(false)}
      />
    </>
  );
}
