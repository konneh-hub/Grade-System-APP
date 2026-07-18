"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const INACTIVITY_LIMIT = 120_000;
const COUNTDOWN_DURATION = 30;

export default function SessionTimeoutModal() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [loggingOut, setLoggingOut] = useState(false);
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (inactivityRef.current) { clearTimeout(inactivityRef.current); inactivityRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  const startInactivityTimer = useCallback(() => {
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    inactivityRef.current = setTimeout(() => {
      setCountdown(COUNTDOWN_DURATION);
      setShowWarning(true);
    }, INACTIVITY_LIMIT);
  }, []);

  const resetInactivity = useCallback(() => {
    setShowWarning(false);
    setCountdown(COUNTDOWN_DURATION);
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    startInactivityTimer();
  }, [startInactivityTimer]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    clearAllTimers();
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    router.push("/login");
  }, [router, clearAllTimers]);

  useEffect(() => {
    startInactivityTimer();

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click", "wheel"];
    function onActivity() { resetInactivity(); }
    for (const ev of events) { window.addEventListener(ev, onActivity, { passive: true }); }

    return () => {
      clearAllTimers();
      for (const ev of events) { window.removeEventListener(ev, onActivity); }
    };
  }, [startInactivityTimer, resetInactivity, clearAllTimers]);

  useEffect(() => {
    if (!showWarning) return;
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; } };
  }, [showWarning, handleLogout]);

  if (!showWarning) return null;

  const progress = (countdown / COUNTDOWN_DURATION) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm mx-4 animate-scale-in">
        <div className="rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-200">
          <div className="flex flex-col items-center text-center">
            {/* Animated timer ring */}
            <div className="relative h-20 w-20">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#E2E8F0" strokeWidth="5" />
                <circle
                  cx="40" cy="40" r="32" fill="none"
                  stroke={countdown <= 10 ? "#DC2626" : "#1E3A8A"}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - progress / 100)}`}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${countdown <= 10 ? "text-red-600 animate-pulse" : "text-slate-900"}`}>
                  {countdown}
                </span>
              </div>
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">Session Expiring</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-xs">
              You have been inactive for a while. For security, your session will expire soon.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={resetInactivity}
              disabled={loggingOut}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Stay Logged In
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? (
                <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Logging out...</>
              ) : (
                <><span className="material-symbols-outlined text-lg">logout</span>Logout Now</>
              )}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Moving your mouse or pressing any key will keep you logged in.
          </p>
        </div>
      </div>
    </div>
  );
}
