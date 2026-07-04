"use client";
import { FormEvent, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";

type Role = "admin" | "lecturer" | "hod" | "dean" | "exam_officer" | "student";

export default function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "male",
    role: "student" as Role,
    faculty: "",
    department: "",
    programme: "",
    academicLevel: "year1",
    externalId: "",
    password: "",
    status: "active",
    generateRegistrationToken: true,
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [createdUserId, setCreatedUserId] = useState<number | null>(null);
  const [registrationInfo, setRegistrationInfo] = useState<{ email: string; token: string; expiresAt?: string | null } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegeneratingToken, setIsRegeneratingToken] = useState(false);

  const showAcademicFields = useMemo(() => form.role !== "admin", [form.role]);
  const showProgramme = useMemo(() => form.role === "student", [form.role]);
  const isStaffTokenRole = useMemo(() => ["lecturer", "hod", "dean", "exam_officer"].includes(form.role), [form.role]);

  async function copyToken() {
    if (!registrationInfo?.token) return;
    await navigator.clipboard.writeText(registrationInfo.token);
    setStatusMessage("Registration token copied to clipboard.");
  }

  async function regenerateToken() {
    if (!createdUserId) return;
    setIsRegeneratingToken(true);
    try {
      const response = await fetch(`/api/users/${createdUserId}/registration-token`, { method: "POST" });
      const payload = (await response.json()) as { error?: string; registration_token?: string; registration_expires_at?: string | null };
      if (!response.ok || !payload.registration_token) {
        setStatusMessage(payload.error ?? "Unable to regenerate token.");
        return;
      }
      setRegistrationInfo((prev) =>
        prev
          ? { ...prev, token: payload.registration_token as string, expiresAt: payload.registration_expires_at ?? null }
          : null
      );
      setStatusMessage("Registration token regenerated successfully.");
    } finally {
      setIsRegeneratingToken(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("");

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          role: form.role,
          status: form.status,
          password: form.password,
          generate_registration_token: isStaffTokenRole,
          student_id: form.role === "student" ? form.externalId : undefined,
          faculty: form.role === "student" ? form.faculty : undefined,
          department: form.role === "student" ? form.department : undefined,
          academic_level: form.role === "student" ? form.academicLevel : undefined,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        id?: number;
        generated_password?: string | null;
        registration_token?: string | null;
        registration_expires_at?: string | null;
      };
      if (!response.ok) {
        setStatusMessage(payload.error ?? "Unable to create user.");
        return;
      }

      const generatedInfo = payload.generated_password ? ` Generated password: ${payload.generated_password}` : "";
      setStatusMessage(`User ${form.firstName} ${form.lastName} created successfully.${generatedInfo}`);
      setCreatedUserId(typeof payload.id === "number" ? payload.id : null);
      setRegistrationInfo(
        payload.registration_token
          ? { email: form.email, token: payload.registration_token, expiresAt: payload.registration_expires_at ?? null }
          : null
      );
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        gender: "male",
        role: "student",
        faculty: "",
        department: "",
        programme: "",
        academicLevel: "year1",
        externalId: "",
        password: "",
        status: "active",
        generateRegistrationToken: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setStatusMessage("");
    setRegistrationInfo(null);
    setCreatedUserId(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="relative max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create User</h2>
            <p className="text-sm text-slate-500">Fill in the details below</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            First Name
            <input
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:bg-white focus:ring-4 focus:ring-[#1E3A8A]/10"
              value={form.firstName}
              onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Last Name
            <input
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:bg-white focus:ring-4 focus:ring-[#1E3A8A]/10"
              value={form.lastName}
              onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:bg-white focus:ring-4 focus:ring-[#1E3A8A]/10"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Phone Number
            <input
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:bg-white focus:ring-4 focus:ring-[#1E3A8A]/10"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Gender
            <select
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:bg-white focus:ring-4 focus:ring-[#1E3A8A]/10"
              value={form.gender}
              onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Role
            <select
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:bg-white focus:ring-4 focus:ring-[#1E3A8A]/10"
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as Role }))}
            >
              <option value="admin">Admin</option>
              <option value="lecturer">Lecturer</option>
              <option value="hod">HoD</option>
              <option value="dean">Dean</option>
              <option value="exam_officer">Exam Officer</option>
              <option value="student">Student</option>
            </select>
          </label>
          {showAcademicFields && (
            <label className="text-sm font-medium text-slate-700">
              Faculty
              <input
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:bg-white focus:ring-4 focus:ring-[#1E3A8A]/10"
                value={form.faculty}
                onChange={(e) => setForm((prev) => ({ ...prev, faculty: e.target.value }))}
              />
            </label>
          )}
          {showAcademicFields && (
            <label className="text-sm font-medium text-slate-700">
              Department
              <input
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:bg-white focus:ring-4 focus:ring-[#1E3A8A]/10"
                value={form.department}
                onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
              />
            </label>
          )}
          {showProgramme && (
            <label className="text-sm font-medium text-slate-700">
              Programme
              <input
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:bg-white focus:ring-4 focus:ring-[#1E3A8A]/10"
                value={form.programme}
                onChange={(e) => setForm((prev) => ({ ...prev, programme: e.target.value }))}
              />
            </label>
          )}
          {showProgramme && (
            <label className="text-sm font-medium text-slate-700">
              Academic Level
              <select
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:bg-white focus:ring-4 focus:ring-[#1E3A8A]/10"
                value={form.academicLevel}
                onChange={(e) => setForm((prev) => ({ ...prev, academicLevel: e.target.value }))}
              >
                <option value="year1">Year 1</option>
                <option value="year2">Year 2</option>
                <option value="year3">Year 3</option>
                <option value="year4">Year 4</option>
                <option value="year5">Year 5</option>
              </select>
            </label>
          )}
          <label className="text-sm font-medium text-slate-700">
            Staff ID / Student ID
            <input
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:bg-white focus:ring-4 focus:ring-[#1E3A8A]/10"
              value={form.externalId}
              onChange={(e) => setForm((prev) => ({ ...prev, externalId: e.target.value }))}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Password
            <input
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:bg-white focus:ring-4 focus:ring-[#1E3A8A]/10"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Leave blank to auto-generate"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:bg-white focus:ring-4 focus:ring-[#1E3A8A]/10"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>

          <div className="col-span-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Registration token is automatically enforced for HoD, Dean, Exam Officer, and Lecturer.
          </div>

          {form.role === "student" && (
            <p className="col-span-full text-xs text-slate-500">
              Students register without token using Student ID, Email, Full Name, Faculty, Department, and Academic Level.
            </p>
          )}

          <div className="col-span-full flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] hover:shadow-xl hover:shadow-[#152C6B]/30 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Save User
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-all duration-300 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>

        {statusMessage && (
          <div className={`mt-4 rounded-lg px-4 py-3 text-sm animate-fade-in-up ${registrationInfo ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-slate-50 text-slate-700 ring-1 ring-slate-200"}`}>
            {statusMessage}
          </div>
        )}

        {registrationInfo && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 animate-fade-in-up">
            <p className="font-semibold">Registration token generated</p>
            <p className="mt-1">Share these details with the user:</p>
            <p className="mt-2"><span className="font-medium">Email:</span> {registrationInfo.email}</p>
            <p><span className="font-medium">Token:</span> {registrationInfo.token}</p>
            {registrationInfo.expiresAt && <p><span className="font-medium">Expires:</span> {new Date(registrationInfo.expiresAt).toLocaleString()}</p>}
            <div className="mt-3 flex items-center gap-2">
              <button type="button" onClick={copyToken} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all duration-300 hover:bg-emerald-50">
                Copy token
              </button>
              <button type="button" onClick={regenerateToken} disabled={isRegeneratingToken || !createdUserId} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-all duration-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60">
                {isRegeneratingToken ? "Regenerating..." : "Regenerate token"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
