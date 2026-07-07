import Link from 'next/link';

export interface DataTableColumn<T> {
  header: string;
  accessor: keyof T;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export default function DataTable<T extends Record<string, unknown>>({
  title,
  description,
  columns,
  rows,
  emptyMessage,
  hrefBuilder,
}: {
  title: string;
  description?: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  hrefBuilder?: (row: T) => string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">{emptyMessage ?? 'No records found.'}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={String(column.accessor)} className="px-3 py-3 text-left font-semibold text-slate-700">{column.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={String(row.id ?? index)} className="hover:bg-slate-50">
                  {columns.map((column) => {
                    const value = row[column.accessor];
                    const content = column.render ? column.render(value, row) : value;

                    return (
                      <td key={String(column.accessor)} className="px-3 py-3 text-slate-700">
                        {hrefBuilder ? (
                          <Link href={hrefBuilder(row)} className="font-medium text-[#2563EB] hover:underline">
                            {content}
                          </Link>
                        ) : (
                          content ?? ''
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
