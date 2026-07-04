"use client";
import Modal from "@/components/ui/Modal";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  type: "success" | "error";
  email?: string;
}

export default function AuthModal({ open, onClose, type, email }: AuthModalProps) {
  const isSuccess = type === "success";

  return (
    <Modal open={open} onClose={onClose}>
      <div className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-slate-200 sm:p-10">
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#1E3A8A]/5 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {isSuccess ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 animate-scale-in">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 animate-scale-in">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}

          <h2 className="mt-5 text-xl font-bold text-[#0F172A]">
            {isSuccess ? "Welcome!" : "Invalid Credentials"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#475569]">
            {isSuccess ? (
              <>
                Signed in as <span className="font-semibold text-[#0F172A]">{email}</span>
              </>
            ) : (
              "The username or password you entered is incorrect. Please try again."
            )}
          </p>

          <div className="mt-6 flex items-center gap-2 text-xs text-[#94A3B8]">
            <svg viewBox="0 0 64 64" fill="none" className="h-5 w-5 text-[#1E3A8A]">
              <path d="M32 12L14 22v4l18-10 18 10v-4L32 12Z" fill="currentColor" className="opacity-30" />
              <path d="M18 28v6c0 6.63 6.27 12 14 12s14-5.37 14-12v-6" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M27 31l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Sierra Leone University Grading Hub</span>
          </div>

          <button
            onClick={onClose}
            className={`mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 ${
              isSuccess
                ? "bg-emerald-600 shadow-emerald-600/25 hover:bg-emerald-700 hover:shadow-emerald-700/30 focus-visible:ring-emerald-600/40"
                : "bg-[#1E3A8A] shadow-[#1E3A8A]/25 hover:bg-[#152C6B] hover:shadow-[#152C6B]/30 focus-visible:ring-[#1E3A8A]/40"
            }`}
          >
            {isSuccess ? "Continue to Dashboard" : "Try Again"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
