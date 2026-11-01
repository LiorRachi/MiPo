"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="back-button"
      onClick={() => router.back()}
    >
      <span aria-hidden="true">‹</span> חזרה
    </button>
  );
}
