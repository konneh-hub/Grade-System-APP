import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

export async function GET() {
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

  return NextResponse.json({ templates, generated });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const type = String(body.type ?? body.reportType ?? 'activity').trim().toLowerCase();
  const format = String(body.format ?? 'pdf').trim().toLowerCase();

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
    .run(template.id, format) as { lastInsertRowid: number };

  return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid), format, type }, { status: 201 });
}
