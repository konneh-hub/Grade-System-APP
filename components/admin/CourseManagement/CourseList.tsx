type CourseRow = {
  id: number;
  code: string;
  title: string;
  description?: string | null;
  credit_units: number;
  level: number | string;
  semester: string;
  is_active: number | string;
  department_name?: string;
  programme_name?: string;
  faculty_name?: string;
};

type CourseListProps = {
  rows: CourseRow[];
  onView: (course: CourseRow) => void;
  onEdit: (course: CourseRow) => void;
  onArchive: (course: CourseRow) => void;
};

function formatLevel(value: number | string) {
  const normalized = String(value ?? '').trim().toLowerCase();
  const mapping: Record<string, string> = {
    year1: 'Year 1',
    year2: 'Year 2',
    year3: 'Year 3',
    year4: 'Year 4',
    year5: 'Year 5',
    '100': 'Year 1',
    '200': 'Year 2',
    '300': 'Year 3',
    '400': 'Year 4',
    '500': 'Year 5',
    '1': 'Year 1',
    '2': 'Year 2',
    '3': 'Year 3',
    '4': 'Year 4',
    '5': 'Year 5',
  };

  return mapping[normalized] ?? `Level ${value}`;
}

export default function CourseList({ rows, onView, onEdit, onArchive }: CourseListProps) {
  if (!rows.length) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No courses match the current filters.</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Code</th>
            <th className="px-4 py-3 font-semibold">Title</th>
            <th className="px-4 py-3 font-semibold">Department</th>
            <th className="px-4 py-3 font-semibold">Level</th>
            <th className="px-4 py-3 font-semibold">Credits</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((course) => (
            <tr key={course.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{course.code}</td>
              <td className="px-4 py-3">
                <button type="button" onClick={() => onView(course)} className="text-left font-medium text-[#2563EB] hover:underline">
                  {course.title}
                </button>
              </td>
              <td className="px-4 py-3 text-slate-600">{course.department_name || course.programme_name || '—'}</td>
              <td className="px-4 py-3 text-slate-600">{formatLevel(course.level)}</td>
              <td className="px-4 py-3 text-slate-600">{course.credit_units}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${Number(course.is_active) === 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {Number(course.is_active) === 0 ? 'Archived' : 'Active'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => onEdit(course)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">
                    Edit
                  </button>
                  <button type="button" onClick={() => onArchive(course)} className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700">
                    Archive
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
