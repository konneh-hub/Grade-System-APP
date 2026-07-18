import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

function ensureReportSchedulesTable() {
  const db = getDatabase();
  db.exec(`CREATE TABLE IF NOT EXISTS report_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_type TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'pdf',
    schedule_cron TEXT,
    next_run_at TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

export async function GET(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  ensureReportSchedulesTable();
  const db = getDatabase();
  const templates = db.prepare('SELECT * FROM report_templates ORDER BY name ASC').all();
  const generated = db
    .prepare(
      `SELECT gr.id, gr.report_template_id, gr.format, gr.status, gr.file_path, gr.generated_at, gr.created_at,
              rt.name AS template_name, rt.category
       FROM generated_reports gr
       LEFT JOIN report_templates rt ON rt.id = gr.report_template_id
       ORDER BY datetime(gr.created_at) DESC`
    )
    .all();
  const schedules = db.prepare('SELECT id, report_type, format, schedule_cron, next_run_at, status, created_at FROM report_schedules ORDER BY id DESC').all();

  return NextResponse.json({ templates, generated, schedules });
}

export async function POST(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  ensureReportSchedulesTable();
  const body = (await req.json()) as Record<string, unknown>;
  const type = String(body.type ?? body.reportType ?? 'activity').trim().toLowerCase();
  const format = String(body.format ?? 'pdf').trim().toLowerCase();
  const scheduled = Boolean(body.scheduled ?? false);

  const normalizedFormat = format === 'excel' ? 'xlsx' : format;

  if (scheduled) {
    const scheduleCron = String(body.schedule_cron ?? '0 0 * * *').trim();
    const nextRunAt = String(body.next_run_at ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()).trim();
    const db = getDatabase();
    const scheduledInsert = db
      .prepare(
        `INSERT INTO report_schedules (report_type, format, schedule_cron, next_run_at, status, created_at)
         VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)`
      )
      .run(type, normalizedFormat, scheduleCron, nextRunAt) as { lastInsertRowid: number };
    return NextResponse.json({ ok: true, scheduled: true, id: Number(scheduledInsert.lastInsertRowid) }, { status: 201 });
  }

  const db = getDatabase();
  let template = db.prepare('SELECT id FROM report_templates WHERE LOWER(category) = ? LIMIT 1').get(type) as { id: number } | null;
  if (!template) {
    const inserted = db
      .prepare('INSERT INTO report_templates (name, description, category, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
      .run(`${type.toUpperCase()} Report`, `Auto template for ${type}`, type) as { lastInsertRowid: number };
    template = { id: Number(inserted.lastInsertRowid) };
  }

  const result = db
    .prepare(
      `INSERT INTO generated_reports (report_template_id, generated_by, format, status, generated_at, created_at)
       VALUES (?, NULL, ?, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
    .run(template.id, normalizedFormat) as { lastInsertRowid: number };

  const generatedId = Number(result.lastInsertRowid);
  const filePath = `/exports/reports/${type}-${generatedId}.${normalizedFormat}`;
  db.prepare('UPDATE generated_reports SET file_path = ? WHERE id = ?').run(filePath, generatedId);

  return NextResponse.json({ ok: true, id: generatedId, format: normalizedFormat, type, file_path: filePath }, { status: 201 });
}
