"use client";
import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import Modal from "@/components/ui/Modal";

interface ImportRow {
  __rowNum: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  role?: string;
  student_id?: string;
  faculty?: string;
  department?: string;
  academic_level?: string;
  password?: string;
  status?: string;
  [key: string]: unknown;
}

export default function UserImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; errors: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setResult({ ok: 0, errors: ["Please upload an Excel file (.xlsx, .xls, or .csv)."] });
      return;
    }
    setResult(null);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<ImportRow>(ws, { defval: "" });
    setParsedRows(data);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    setImporting(true);
    setResult(null);
    const errors: string[] = [];
    let ok = 0;
    for (const row of parsedRows) {
      try {
        const body: Record<string, unknown> = {
          first_name: row.first_name || "",
          last_name: row.last_name || "",
          email: row.email || "",
          phone: row.phone || "",
          gender: row.gender || "male",
          role: row.role || "student",
          status: row.status || "active",
          password: row.password || "",
          generate_registration_token: ["lecturer", "hod", "dean", "exam_officer"].includes(row.role || ""),
        };
        if (row.student_id) body.student_id = row.student_id;
        if (row.faculty) body.faculty = row.faculty;
        if (row.department) body.department = row.department;
        if (row.academic_level) body.academic_level = row.academic_level;
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const payload = await res.json();
        if (!res.ok) {
          errors.push(`Row ${row.__rowNum}: ${payload.error || "Unknown error"}`);
        } else {
          ok++;
        }
      } catch {
        errors.push(`Row ${row.__rowNum}: Network error`);
      }
    }
    setResult({ ok, errors });
    setImporting(false);
  }

  function handleReset() {
    setParsedRows([]);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    handleReset();
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="relative max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Import Users</h2>
            <p className="text-sm text-slate-500">Upload an Excel file to batch-create users</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Drop zone */}
        {parsedRows.length === 0 && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
              dragOver
                ? "border-[#1E3A8A] bg-blue-50"
                : "border-slate-300 bg-slate-50 hover:border-[#1E3A8A] hover:bg-blue-50/50"
            }`}
          >
            <span className="material-symbols-outlined text-4xl text-slate-400">upload_file</span>
            <p className="mt-3 text-sm font-medium text-slate-700">Drop an Excel file here, or click to browse</p>
            <p className="mt-1 text-xs text-slate-500">Supports .xlsx, .xls, .csv</p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        )}

        {/* Preview */}
        {parsedRows.length > 0 && !result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">{parsedRows.length} row(s) parsed</p>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium text-[#1E3A8A] hover:underline"
              >
                Choose different file
              </button>
            </div>
            <div className="max-h-48 overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {Object.keys(parsedRows[0] || {}).filter((k) => k !== "__rowNum").map((key) => (
                      <th key={key} className="px-2 py-2 text-left font-semibold text-slate-600">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {Object.entries(row).filter(([k]) => k !== "__rowNum").map(([key, val]) => (
                        <td key={key} className="px-2 py-1.5 text-slate-700">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
            >
              {importing ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Importing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">cloud_upload</span>
                  Import {parsedRows.length} user(s)
                </>
              )}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3 animate-fade-in-up">
            <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
              <span className="font-semibold">{result.ok}</span> user(s) imported successfully.
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-auto rounded-lg bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
                <p className="mb-2 font-semibold">{result.errors.length} error(s):</p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs leading-5">{err}</p>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B]"
            >
              <span className="material-symbols-outlined text-lg">upload_file</span>
              Import another file
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
