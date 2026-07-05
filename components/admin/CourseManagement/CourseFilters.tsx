import { type ChangeEvent } from 'react';

type FilterState = {
  facultyId: string;
  departmentId: string;
  programmeId: string;
  level: string;
  semester: string;
  status: string;
};

type FacultyOption = { id: number; name: string };
type DepartmentOption = { id: number; name: string; faculty_id?: number | null };
type ProgrammeOption = { id: number; name: string; department_id?: number | null };

type CourseFiltersProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: FilterState;
  onFilterChange: (field: keyof FilterState, value: string) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
  onAddCourse: () => void;
  onImportCourses: () => void;
  faculties: FacultyOption[];
  departments: DepartmentOption[];
  programmes: ProgrammeOption[];
};

export default function CourseFilters({
  searchValue,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  onApplyFilters,
  onAddCourse,
  onImportCourses,
  faculties,
  departments,
  programmes,
}: CourseFiltersProps) {
  const handleSelectChange = (field: keyof FilterState) => (event: ChangeEvent<HTMLSelectElement>) => {
    onFilterChange(field, event.target.value);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1">
          <label htmlFor="course-search" className="text-sm font-medium text-slate-700">Search courses</label>
          <input
            id="course-search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onApplyFilters();
              }
            }}
            placeholder="Search by code or title"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0"
            aria-label="Search courses"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <div>
            <label htmlFor="course-faculty-filter" className="sr-only">Faculty</label>
            <select id="course-faculty-filter" value={filters.facultyId} onChange={handleSelectChange('facultyId')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label="Faculty filter">
              <option value="">All faculties</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="course-department-filter" className="sr-only">Department</label>
            <select id="course-department-filter" value={filters.departmentId} onChange={handleSelectChange('departmentId')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label="Department filter">
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="course-programme-filter" className="sr-only">Programme</label>
            <select id="course-programme-filter" value={filters.programmeId} onChange={handleSelectChange('programmeId')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label="Programme filter">
              <option value="">All programmes</option>
              {programmes.map((programme) => (
                <option key={programme.id} value={programme.id}>
                  {programme.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="course-level-filter" className="sr-only">Academic level</label>
            <select id="course-level-filter" value={filters.level} onChange={handleSelectChange('level')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label="Academic level filter">
              <option value="">All levels</option>
              <option value="year1">Year 1</option>
              <option value="year2">Year 2</option>
              <option value="year3">Year 3</option>
              <option value="year4">Year 4</option>
              <option value="year5">Year 5</option>
            </select>
          </div>

          <div>
            <label htmlFor="course-semester-filter" className="sr-only">Semester</label>
            <select id="course-semester-filter" value={filters.semester} onChange={handleSelectChange('semester')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label="Semester filter">
              <option value="">All semesters</option>
              <option value="first">First</option>
              <option value="second">Second</option>
            </select>
          </div>

          <div>
            <label htmlFor="course-status-filter" className="sr-only">Status</label>
            <select id="course-status-filter" value={filters.status} onChange={handleSelectChange('status')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label="Status filter">
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <button type="button" onClick={onApplyFilters} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
            Apply filters
          </button>

          <button type="button" onClick={onClearFilters} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
            Clear
          </button>

          <button type="button" onClick={onImportCourses} className="rounded-lg border border-[#1A3A6B] px-4 py-2 text-sm font-semibold text-[#1A3A6B]">
            Import courses
          </button>

          <button type="button" onClick={onAddCourse} className="rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white">
            + Add course
          </button>
        </div>
      </div>
    </section>
  );
}
