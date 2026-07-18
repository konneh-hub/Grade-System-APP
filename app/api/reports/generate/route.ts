import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

export async function POST(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const body = (await req.json()) as {
    type?: string;
    title?: string;
    description?: string;
    requested_by?: number;
  };

  const type = (body.type || 'custom').toLowerCase();
  const title = (body.title || `${type.toUpperCase()} Report`).trim();
  const description = (body.description || `Generated ${type} report`).trim();

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const db = getDatabase();

  let templateId: number;
  const existingTemplate = db.prepare('SELECT id FROM report_templates WHERE type = ? LIMIT 1').get(type) as { id: number } | null;
  if (existingTemplate) {
    templateId = existingTemplate.id;
  } else {
    const inserted = db
      .prepare('INSERT INTO report_templates (name, type, description, is_system) VALUES (?, ?, ?, 0)')
      .run(title, type, description) as { lastInsertRowid: number | bigint };
    templateId = Number(inserted.lastInsertRowid);
  }

  const generated = db
    .prepare('INSERT INTO generated_reports (template_id, requested_by, status) VALUES (?, ?, ?)')
    .run(templateId, body.requested_by ? Number(body.requested_by) : null, 'completed') as { lastInsertRowid: number | bigint };

  return NextResponse.json({
    ok: true,
    generated_report_id: Number(generated.lastInsertRowid),
    template_id: templateId,
  });
}
