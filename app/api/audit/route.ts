import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

function dateOnly(value: string): string {
  return value.length >= 10 ? value.slice(0, 10) : value;
}

export async function GET(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const db = getDatabase();
  const { searchParams } = new URL(req.url);
  const exportFormat = String(searchParams.get('export') ?? '').trim().toLowerCase();

  const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') ?? 100)));
  const user = String(searchParams.get('user') ?? '').trim().toLowerCase();
  const role = String(searchParams.get('role') ?? '').trim().toLowerCase();
  const moduleName = String(searchParams.get('module') ?? '').trim().toLowerCase();
  const action = String(searchParams.get('action') ?? '').trim().toLowerCase();
  const from = String(searchParams.get('from') ?? '').trim();
  const to = String(searchParams.get('to') ?? '').trim();

  const where: string[] = [];
  const params: unknown[] = [];

  if (user) {
    where.push("LOWER(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, ''))) LIKE ?");
    params.push(`%${user}%`);
  }
  if (role) {
    where.push('LOWER(COALESCE(r.name, \"system\")) LIKE ?');
    params.push(`%${role}%`);
  }
  if (moduleName) {
    where.push('LOWER(al.entity_type) LIKE ?');
    params.push(`%${moduleName}%`);
  }
  if (action) {
    where.push('LOWER(al.action) LIKE ?');
    params.push(`%${action}%`);
  }
  if (from) {
    where.push('date(al.created_at) >= date(?)');
    params.push(dateOnly(from));
  }
  if (to) {
    where.push('date(al.created_at) <= date(?)');
    params.push(dateOnly(to));
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT al.id,
              al.action,
              al.entity_type,
              al.entity_id,
              al.details,
              al.ip_address,
              al.created_at,
              TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS actor_name,
              r.name AS actor_role
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.actor_id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       ${whereClause}
       ORDER BY datetime(al.created_at) DESC
       LIMIT ?`
    )
    .all(...params, limit) as Array<Record<string, unknown>>;

  const normalized = rows.map((row) => {
    const timestamp = String(row.created_at ?? '');
    return {
      id: Number(row.id),
      user: row.actor_name ? String(row.actor_name) : 'System',
      role: row.actor_role ? String(row.actor_role) : 'system',
      module: String(row.entity_type ?? 'general'),
      action: String(row.action ?? 'unknown'),
      details: row.details ? String(row.details) : null,
      entity_id: row.entity_id != null ? Number(row.entity_id) : null,
      ip_address: row.ip_address ? String(row.ip_address) : null,
      timestamp,
      date: timestamp ? new Date(timestamp).toLocaleDateString() : '',
      time: timestamp ? new Date(timestamp).toLocaleTimeString() : '',
    };
  });

  if (exportFormat === 'csv') {
    const header = ['id', 'user', 'role', 'module', 'action', 'details', 'entity_id', 'ip_address', 'timestamp'];
    const lines = [header.join(',')];
    for (const item of normalized) {
      const values = [
        item.id,
        item.user,
        item.role,
        item.module,
        item.action,
        item.details ?? '',
        item.entity_id ?? '',
        item.ip_address ?? '',
        item.timestamp,
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`);
      lines.push(values.join(','));
    }
    return new Response(lines.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="audit-logs.csv"',
      },
    });
  }

  return NextResponse.json(normalized);
}
