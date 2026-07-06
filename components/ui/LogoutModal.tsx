"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface LogoutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LogoutModal({ open, onClose }: LogoutModalProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/login");
  }, [router]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-sm mx-4 animate-scale-in">
        <div className="rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-200">
          <div className="flex flex-col items-center text-center">
            {/* Animated icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-200 animate-bounce-in">
              <span className="material-symbols-outlined text-3xl text-red-500">logout</span>
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">Leave so soon?</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-xs">
              Are you sure you want to log out of your account? You will need to sign in again to access the dashboard.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-all duration-300 hover:bg-red-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
            >
              {loggingOut ? (
                <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Logging out...</>
              ) : (
                <><span className="material-symbols-outlined text-lg">logout</span>Yes, Logout</>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loggingOut}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Stay Logged In
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Your session will be securely ended.
          </p>
        </div>
      </div>
    </div>
  );
}
