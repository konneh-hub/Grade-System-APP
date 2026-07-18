import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireRoles } from '@/lib/middleware/authorization';

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: ParamsContext) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;

  const { id } = await context.params;
  const auditId = Number(id);
  if (!Number.isFinite(auditId) || auditId <= 0) {
    return NextResponse.json({ error: 'Invalid audit id' }, { status: 400 });
  }

  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT al.id,
              al.action,
              al.entity_type,
              al.entity_id,
              al.details,
              al.ip_address,
              al.created_at,
              TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS actor_name,
              GROUP_CONCAT(DISTINCT r.name, ',') AS actor_roles
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.actor_id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE al.id = ?
       GROUP BY al.id`
    )
    .get(auditId) as Record<string, unknown> | null;

  if (!row) {
    return NextResponse.json({ error: 'Audit log not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: Number(row.id),
    action: String(row.action ?? ''),
    entity_type: String(row.entity_type ?? ''),
    entity_id: row.entity_id != null ? Number(row.entity_id) : null,
    details: row.details != null ? String(row.details) : null,
    ip_address: row.ip_address != null ? String(row.ip_address) : null,
    created_at: String(row.created_at ?? ''),
    actor_name: String(row.actor_name ?? 'System'),
    actor_roles: typeof row.actor_roles === 'string' ? String(row.actor_roles).split(',') : [],
  });
}
