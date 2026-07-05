import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/config/database";

export async function GET() {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT r.id, r.name, r.description, r.created_at,
              COUNT(DISTINCT ur.user_id) AS user_count,
              COALESCE(GROUP_CONCAT(DISTINCT p.name), '') AS permission_names
       FROM roles r
       LEFT JOIN user_roles ur ON ur.role_id = r.id
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN permissions p ON p.id = rp.permission_id
       GROUP BY r.id
       ORDER BY r.name ASC`
    )
    .all() as Array<Record<string, unknown>>;

  const result = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    created_at: row.created_at,
    user_count: row.user_count,
    permissions: typeof row.permission_names === "string" && String(row.permission_names).length > 0
      ? String(row.permission_names).split(",")
      : [],
  }));

  return NextResponse.json(result);
}
