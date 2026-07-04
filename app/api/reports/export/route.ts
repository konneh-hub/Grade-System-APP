import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

function csvEscape(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = String(searchParams.get('type') ?? 'all').trim().toLowerCase();
  const format = String(searchParams.get('format') ?? 'csv').trim().toLowerCase();

  if (!['csv', 'xlsx', 'pdf', 'excel'].includes(format)) {
    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  }

  const db = getDatabase();
  const where = type === 'all' ? '' : 'WHERE LOWER(rt.category) = ?';
  const rows = db
    .prepare(
      `SELECT gr.id, rt.name AS template_name, rt.category, gr.format, gr.status, gr.file_path, gr.generated_at, gr.created_at
       FROM generated_reports gr
       LEFT JOIN report_templates rt ON rt.id = gr.report_template_id
       ${where}
       ORDER BY datetime(gr.created_at) DESC`
    )
    .all(...(type === 'all' ? [] : [type])) as Array<Record<string, unknown>>;

  if (format === 'csv') {
    const header = ['id', 'template_name', 'category', 'format', 'status', 'file_path', 'generated_at', 'created_at'];
    const lines = [header.join(',')];
    for (const row of rows) {
      lines.push([
        row.id,
        row.template_name,
        row.category,
        row.format,
        row.status,
        row.file_path,
        row.generated_at,
        row.created_at,
      ].map(csvEscape).join(','));
    }

    return new Response(lines.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reports-${type}.csv"`,
      },
    });
  }

  // Placeholder response for pdf/xlsx where true binary generation is not yet wired.
  return NextResponse.json({
    ok: true,
    type,
    format: format === 'excel' ? 'xlsx' : format,
    count: rows.length,
    items: rows,
  });
}
