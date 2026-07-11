'use client';

import { useEffect, useState, type FormEvent } from 'react';
import CourseBulkImport from '@/components/admin/CourseManagement/CourseBulkImport';
import CourseFilters from '@/components/admin/CourseManagement/CourseFilters';
import CourseForm from '@/components/admin/CourseManagement/CourseForm';
import CourseList from '@/components/admin/CourseManagement/CourseList';

type CourseRow = {
  id: number;
  code: string;
  title: string;
  description?: string | null;
  department_id?: number | null;
  programme_id?: number | null;
  credit_units: number;
  level: number | string;
  semester: string;
  is_active: number | string;
  department_name?: string;
  programme_name?: string;
  faculty_name?: string;
};

type FacultyOption = { id: number; name: string };
type DepartmentOption = { id: number; name: string; faculty_id?: number | null };
type ProgrammeOption = { id: number; name: string; department_id?: number | null };

type FilterState = {
  facultyId: string;
  departmentId: string;
  programmeId: string;
  level: string;
  semester: string;
  status: string;
};

const initialFilters: FilterState = {
  facultyId: '',
  departmentId: '',
  programmeId: '',
  level: '',
  semester: '',
  status: '',
};

const initialForm = {
  code: '',
  title: '',
  creditUnits: '3',
  level: 'year1',
  semester: 'first',
  departmentId: '',
  programmeId: '',
  status: 'active',
  description: '',
};

export default function Page() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [programmes, setProgrammes] = useState<ProgrammeOption[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCourse, setSelectedCourse] = useState<CourseRow | null>(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    void loadMetadata();
    void loadCourses();
  }, []);

  async function loadMetadata() {
    try {
      const [facultiesRes, departmentsRes, programmesRes] = await Promise.all([
        fetch('/api/faculties', { cache: 'no-store' }),
        fetch('/api/departments', { cache: 'no-store' }),
        fetch('/api/programmes', { cache: 'no-store' }),
      ]);
      setFaculties((await facultiesRes.json()) as FacultyOption[]);
      setDepartments((await departmentsRes.json()) as DepartmentOption[]);
      setProgrammes((await programmesRes.json()) as ProgrammeOption[]);
    } catch {
      setError('Unable to load catalog metadata.');
    }
  }

  async function loadCourses() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchValue.trim()) params.set('q', searchValue.trim());
      if (filters.facultyId) params.set('faculty_id', filters.facultyId);
      if (filters.departmentId) params.set('department_id', filters.departmentId);
      if (filters.programmeId) params.set('programme_id', filters.programmeId);
      if (filters.level) params.set('level', filters.level);
      if (filters.semester) params.set('semester', filters.semester);
      if (filters.status) params.set('status', filters.status);

      const response = await fetch(`/api/courses?${params.toString()}`, { cache: 'no-store' });
      setCourses(((await response.json()) as CourseRow[]) ?? []);
    } catch {
      setError('Unable to load modules right now.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ ...initialForm });
    setSelectedCourse(null);
  }

  function openCreateModal() {
    resetForm();
    setModalMode('create');
    setShowModal(true);
    setError('');
    setSuccess('');
  }

  function openEditModal(course: CourseRow) {
    setSelectedCourse(course);
    setForm({
      code: course.code,
      title: course.title,
      creditUnits: String(course.credit_units ?? 3),
      level: String(course.level ?? 'year1').toLowerCase().replace('100', 'year1').replace('200', 'year2').replace('300', 'year3').replace('400', 'year4').replace('500', 'year5'),
      semester: String(course.semester ?? 'first'),
      departmentId: course.department_id != null ? String(course.department_id) : '',
      programmeId: course.programme_id != null ? String(course.programme_id) : '',
      status: Number(course.is_active) === 0 ? 'archived' : 'active',
      description: course.description ?? '',
    });
    setModalMode('edit');
    setShowModal(true);
    setError('');
    setSuccess('');
  }

  function handleFieldChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = modalMode === 'create' ? '/api/courses' : `/api/courses/${selectedCourse?.id ?? ''}`;
      const method = modalMode === 'create' ? 'POST' : 'PATCH';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          title: form.title,
          description: form.description,
          credit_units: Number(form.creditUnits),
          level: form.level,
          semester: form.semester,
          department_id: form.departmentId ? Number(form.departmentId) : null,
          programme_id: form.programmeId ? Number(form.programmeId) : null,
          status: form.status,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to save module.');
      setSuccess(modalMode === 'create' ? 'Module created successfully.' : 'Module updated successfully.');
      setShowModal(false);
      resetForm();
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save module.');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(course: CourseRow) {
    if (!window.confirm('Archive this module? Archived modules cannot be reused for future academic sessions.')) return;
    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: 0, status: 'archived' }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to archive module.');
      setSuccess('Module archived successfully.');
      await loadCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to archive module.');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Module management</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Create, search, filter, edit, and archive modules with Year 1–5 academic levels.</p>
      </section>

      {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
      {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div> : null}

      <CourseFilters
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        onFilterChange={(field: keyof FilterState, value: string) => setFilters((prev) => ({ ...prev, [field]: value }))}
        onClearFilters={() => {
          setSearchValue('');
          setFilters(initialFilters);
          void loadCourses();
        }}
        onApplyFilters={() => { void loadCourses(); }}
        onAddCourse={openCreateModal}
        onImportCourses={() => setShowBulkImport(true)}
        faculties={faculties}
        departments={departments}
        programmes={programmes}
      />

      {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading modules...</div> : <CourseList rows={courses} onView={openEditModal} onEdit={openEditModal} onArchive={handleArchive} />}

      <CourseBulkImport
        key={showBulkImport ? 'bulk-import-open' : 'bulk-import-closed'}
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImported={() => {
          setSuccess('Bulk import completed.');
          void loadCourses();
        }}
      />

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{modalMode === 'create' ? 'Add new module' : 'Edit module'}</h2>
                <p className="text-sm text-slate-600">{modalMode === 'create' ? 'Create a module for the academic catalog.' : 'Update module details and availability.'}</p>
              </div>
              <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">Close</button>
            </div>
            <CourseForm mode={modalMode} form={form} onChange={handleFieldChange} onSubmit={handleSubmit} onCancel={() => { setShowModal(false); resetForm(); }} saving={saving} departments={departments} programmes={programmes} error={error} success={success} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
