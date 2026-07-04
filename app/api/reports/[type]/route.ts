import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

type ParamsContext = { params: Promise<{ type: string }> };

export async function GET(_req: Request, context: ParamsContext) {
  const { type } = await context.params;
  const reportType = String(type ?? '').trim().toLowerCase();
  if (!reportType) {
    return NextResponse.json({ error: 'Report type is required' }, { status: 400 });
  }

  const db = getDatabase();
  const template = db
    .prepare('SELECT id, name, description, category, created_at FROM report_templates WHERE LOWER(category) = ? LIMIT 1')
    .get(reportType) as Record<string, unknown> | null;

  const generated = db
    .prepare(
      `SELECT gr.id, gr.report_template_id, gr.format, gr.status, gr.file_path, gr.generated_at, gr.created_at,
              rt.name AS template_name, rt.category
       FROM generated_reports gr
       LEFT JOIN report_templates rt ON rt.id = gr.report_template_id
       WHERE LOWER(rt.category) = ?
       ORDER BY datetime(gr.created_at) DESC`
    )
    .all(reportType);

  return NextResponse.json({ type: reportType, template, generated });
}

export async function POST(req: Request, context: ParamsContext) {
  const { type } = await context.params;
  const reportType = String(type ?? '').trim().toLowerCase();
  if (!reportType) {
    return NextResponse.json({ error: 'Report type is required' }, { status: 400 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const format = String(body.format ?? 'pdf').trim().toLowerCase();
  const allowedFormats = new Set(['pdf', 'csv', 'xlsx', 'excel']);
  if (!allowedFormats.has(format)) {
    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  }

  const db = getDatabase();
  let template = db
    .prepare('SELECT id, name FROM report_templates WHERE LOWER(category) = ? LIMIT 1')
    .get(reportType) as { id: number; name: string } | null;

  if (!template) {
    const inserted = db
      .prepare('INSERT INTO report_templates (name, description, category, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
      .run(
        `${reportType.toUpperCase()} Report`,
        String(body.description ?? `Auto template for ${reportType}`),
        reportType
      ) as { lastInsertRowid: number };
    template = {
      id: Number(inserted.lastInsertRowid),
      name: `${reportType.toUpperCase()} Report`,
    };
  }

  const created = db
    .prepare(
      `INSERT INTO generated_reports (report_template_id, generated_by, format, status, generated_at, created_at)
       VALUES (?, NULL, ?, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
    .run(template.id, format === 'excel' ? 'xlsx' : format) as { lastInsertRowid: number };

  return NextResponse.json(
    {
      ok: true,
      id: Number(created.lastInsertRowid),
      type: reportType,
      template: template.name,
      format: format === 'excel' ? 'xlsx' : format,
    },
    { status: 201 }
  );
}

export async function DELETE(req: Request, context: ParamsContext) {
  const { type } = await context.params;
  const reportType = String(type ?? '').trim().toLowerCase();
  const { searchParams } = new URL(req.url);
  const generatedId = Number(searchParams.get('generated_id') ?? 0);
  const scheduleId = Number(searchParams.get('schedule_id') ?? 0);

  const db = getDatabase();
  if (Number.isFinite(generatedId) && generatedId > 0) {
    const result = db.prepare(
      `DELETE FROM generated_reports
       WHERE id = ? AND report_template_id IN (
         SELECT id FROM report_templates WHERE LOWER(category) = ?
       )`
    ).run(generatedId, reportType) as { changes?: number };
    if (!result.changes) return NextResponse.json({ error: 'Generated report not found' }, { status: 404 });
    return NextResponse.json({ ok: true, deleted: 'generated', id: generatedId });
  }

  if (Number.isFinite(scheduleId) && scheduleId > 0) {
    const result = db.prepare('DELETE FROM report_schedules WHERE id = ? AND LOWER(report_type) = ?').run(scheduleId, reportType) as { changes?: number };
    if (!result.changes) return NextResponse.json({ error: 'Report schedule not found' }, { status: 404 });
    return NextResponse.json({ ok: true, deleted: 'schedule', id: scheduleId });
  }

  return NextResponse.json({ error: 'generated_id or schedule_id is required' }, { status: 400 });
}
