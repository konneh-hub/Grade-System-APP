import { type FormEvent } from 'react';

type DepartmentOption = { id: number; name: string; faculty_id?: number | null };
type ProgrammeOption = { id: number; name: string; department_id?: number | null };

type CourseFormProps = {
  mode: 'create' | 'edit';
  form: {
    code: string;
    title: string;
    creditUnits: string;
    level: string;
    semester: string;
    departmentId: string;
    programmeId: string;
    status: string;
    description: string;
  };
  onChange: (field: string, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  saving: boolean;
  departments: DepartmentOption[];
  programmes: ProgrammeOption[];
  error?: string;
  success?: string;
};

export default function CourseForm({
  mode,
  form,
  onChange,
  onSubmit,
  onCancel,
  saving,
  departments,
  programmes,
  error,
  success,
}: CourseFormProps) {
  const filteredProgrammes = programmes.filter((programme) => !form.departmentId || String(programme.department_id ?? '') === form.departmentId);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Module code
          <input required value={form.code} onChange={(event) => onChange('code', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Module title
          <input required value={form.title} onChange={(event) => onChange('title', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Credit units
          <select required value={form.creditUnits} onChange={(event) => onChange('creditUnits', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
            {[1, 2, 3, 4, 5, 6].map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Academic level
          <select value={form.level} onChange={(event) => onChange('level', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="year1">Year 1</option>
            <option value="year2">Year 2</option>
            <option value="year3">Year 3</option>
            <option value="year4">Year 4</option>
            <option value="year5">Year 5</option>
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Department
          <select required value={form.departmentId} onChange={(event) => onChange('departmentId', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Select department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Programme
          <select required value={form.programmeId} onChange={(event) => onChange('programmeId', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="">Select programme</option>
            {filteredProgrammes.map((programme) => (
              <option key={programme.id} value={programme.id}>
                {programme.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Semester
          <select value={form.semester} onChange={(event) => onChange('semester', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="first">First</option>
            <option value="second">Second</option>
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Status
          <select value={form.status} onChange={(event) => onChange('status', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Description
        <textarea value={form.description} onChange={(event) => onChange('description', event.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? (mode === 'create' ? 'Saving...' : 'Updating...') : mode === 'create' ? 'Save module' : 'Update module'}
        </button>
      </div>
    </form>
  );
}
