"use client";
import { useState } from "react";
import CreateUserModal from "@/components/admin/CreateUserModal";

export default function UsersPageClient() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] hover:shadow-xl hover:shadow-[#152C6B]/30 hover:-translate-y-0.5 active:translate-y-0"
      >
        <span className="material-symbols-outlined text-lg">add</span>
        Add User
      </button>
      <CreateUserModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
