'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import * as XLSX from 'xlsx';

type CourseBulkImportProps = {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
};

type DepartmentOption = { id: number; name: string };
type ProgrammeOption = { id: number; name: string };

type ImportRow = {
  code?: string;
  title?: string;
  credit_units?: string | number;
  credits?: string | number;
  level?: string | number;
  department_id?: string | number;
  department?: string | number;
  department_name?: string;
  programme_id?: string | number;
  programme?: string | number;
  programme_name?: string;
  semester?: string;
  status?: string;
  description?: string;
};

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function normalizeLevel(value: unknown) {
  const raw = String(value ?? 'year1').trim().toLowerCase();
  const mapping: Record<string, string> = {
    year1: 'year1',
    year2: 'year2',
    year3: 'year3',
    year4: 'year4',
    year5: 'year5',
    '100': 'year1',
    '200': 'year2',
    '300': 'year3',
    '400': 'year4',
    '500': 'year5',
    '1': 'year1',
    '2': 'year2',
    '3': 'year3',
    '4': 'year4',
    '5': 'year5',
  };

  return mapping[raw] ?? 'year1';
}

function normalizeSemester(value: unknown) {
  const raw = String(value ?? 'first').trim().toLowerCase();
  const mapping: Record<string, string> = {
    first: 'first',
    1: 'first',
    firstsemester: 'first',
    semester1: 'first',
    second: 'second',
    2: 'second',
    secondsemester: 'second',
    semester2: 'second',
    third: 'third',
    3: 'third',
    summer: 'third',
  };

  return mapping[raw] ?? 'first';
}

function normalizeStatus(value: unknown) {
  const raw = String(value ?? 'active').trim().toLowerCase();
  return raw === 'archived' || raw === 'inactive' || raw === '0' ? 'archived' : 'active';
}

export default function CourseBulkImport({ open, onClose, onImported }: CourseBulkImportProps) {
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [programmes, setProgrammes] = useState<ProgrammeOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function resetImportState() {
    setFileName('');
    setRows([]);
    setError('');
    setSuccess('');
  }

  function handleClose() {
    resetImportState();
    onClose();
  }

  useEffect(() => {
    if (!open) return;

    async function loadMetadata() {
      try {
        const [departmentsRes, programmesRes] = await Promise.all([
          fetch('/api/departments', { cache: 'no-store' }),
          fetch('/api/programmes', { cache: 'no-store' }),
        ]);
        setDepartments((await departmentsRes.json()) as DepartmentOption[]);
        setProgrammes((await programmesRes.json()) as ProgrammeOption[]);
      } catch {
        setError('Unable to load department and programme metadata.');
      }
    }

    void loadMetadata();
  }, [open]);

  const departmentLookup = useMemo(() => new Map(departments.map((dept) => [dept.name.toLowerCase(), dept.id])), [departments]);
  const programmeLookup = useMemo(() => new Map(programmes.map((programme) => [programme.name.toLowerCase(), programme.id])), [programmes]);

  function readFile(file: File) {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) throw new Error('No file data was read.');

        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const parsed = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        const normalizedRows = parsed.map((row) => {
          const normalized: Record<string, unknown> = {};
          Object.entries(row).forEach(([key, value]) => {
            normalized[normalizeHeader(key)] = value;
          });
          return normalized;
        });
        setRows(normalizedRows as ImportRow[]);
        setFileName(file.name);
        setSuccess(`Loaded ${normalizedRows.length} rows. Review and import them.`);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to read that file.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
      setError('Please select a .csv, .xlsx, or .xls file.');
      return;
    }
    readFile(file);
  }

  async function handleImport() {
    if (!rows.length) {
      setError('Upload a file with at least one course row.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = rows.map((row) => {
        const departmentValue = String(row.department_id ?? row.department ?? row.department_name ?? '').trim();
        const programmeValue = String(row.programme_id ?? row.programme ?? row.programme_name ?? '').trim();
        const departmentId = Number.isFinite(Number(departmentValue)) ? Number(departmentValue) : departmentLookup.get(departmentValue.toLowerCase()) ?? null;
        const programmeId = Number.isFinite(Number(programmeValue)) ? Number(programmeValue) : programmeLookup.get(programmeValue.toLowerCase()) ?? null;

        return {
          code: String(row.code ?? '').trim().toUpperCase(),
          title: String(row.title ?? '').trim(),
          credit_units: Number(row.credit_units ?? row.credits ?? 3),
          level: normalizeLevel(row.level),
          department_id: departmentId,
          programme_id: programmeId,
          semester: normalizeSemester(row.semester),
          status: normalizeStatus(row.status),
          description: String(row.description ?? '').trim(),
        };
      });

      const response = await fetch('/api/courses/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string; imported?: number; failed?: number };
      if (!response.ok) throw new Error(result.error || 'Bulk import failed.');

      setSuccess(`Imported ${result.imported ?? payload.length} courses successfully.`);
      onImported();
      setTimeout(() => handleClose(), 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk import failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Import courses in bulk</h2>
            <p className="mt-1 text-sm text-slate-600">Upload a .csv, .xlsx, or .xls file with course rows. The import accepts code, title, credit units, academic level, department, programme, semester, status, and description.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">Close</button>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600">
            <span className="text-base font-semibold text-slate-800">Choose a file</span>
            <span>{fileName || 'Select a spreadsheet or CSV with course records'}</span>
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}

        {rows.length ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">Preview ({rows.length} rows)</div>
            <div className="max-h-72 overflow-auto p-3 text-sm">
              <pre className="whitespace-pre-wrap text-slate-600">{JSON.stringify(rows.slice(0, 5), null, 2)}</pre>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button type="button" onClick={handleClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
          <button type="button" disabled={submitting || !rows.length} onClick={handleImport} className="rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? 'Importing...' : 'Import courses'}
          </button>
        </div>
      </div>
    </div>
  );
}
