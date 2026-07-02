import { getDatabase } from '@/lib/config/database';

export interface AuditActivity {
	id: number;
	title: string;
	user: string;
	timestamp: string;
	detail: string;
}

type AuditRow = {
	id: number;
	action: string;
	entity_type: string;
	details: string | null;
	created_at: string;
	actor_name: string | null;
};

export function getRecentAuditActivity(limit = 8): AuditActivity[] {
	const db = getDatabase();
	const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(50, Math.floor(limit))) : 8;

	const rows = db
		.prepare(
			`SELECT
				al.id,
				al.action,
				al.entity_type,
				al.details,
				al.created_at,
				TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS actor_name
			 FROM audit_logs al
			 LEFT JOIN users u ON u.id = al.actor_id
			 ORDER BY datetime(al.created_at) DESC
			 LIMIT ?`
		)
		.all(safeLimit) as AuditRow[];

	return rows.map((row) => ({
		id: row.id,
		title: row.action,
		user: row.actor_name && row.actor_name.length > 0 ? row.actor_name : 'System',
		timestamp: row.created_at,
		detail: row.details ?? `Activity in ${row.entity_type} module`,
	}));
}

