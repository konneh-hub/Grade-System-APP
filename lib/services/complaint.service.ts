import { prepare } from '@/lib/config/database';

export interface ComplaintRow {
  id: number;
  student_id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
}

export function listComplaints(studentId?: number) {
  if (studentId != null) {
    return prepare('SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC').all(studentId) as ComplaintRow[];
  }
  return prepare('SELECT * FROM complaints ORDER BY created_at DESC').all() as ComplaintRow[];
}

export function getComplaintById(id: number): ComplaintRow | null {
  const row = prepare('SELECT * FROM complaints WHERE id = ?').get(id) as ComplaintRow | null;
  return row || null;
}

export function createComplaint(payload: Partial<ComplaintRow>) {
  const result = prepare(
    `INSERT INTO complaints (student_id, title, description, category, status, priority, assigned_to, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  ).run(
    payload.student_id ?? 0,
    payload.title ?? 'Untitled complaint',
    payload.description ?? '',
    payload.category ?? 'general',
    payload.status ?? 'open',
    payload.priority ?? 'medium',
    payload.assigned_to ?? null
  ) as { lastInsertRowid: number };

  return getComplaintById(Number(result.lastInsertRowid));
}

export function updateComplaint(id: number, payload: Partial<ComplaintRow>) {
  const existing = getComplaintById(id);
  if (!existing) return null;

  prepare(
    `UPDATE complaints SET student_id = ?, title = ?, description = ?, category = ?, status = ?, priority = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(
    payload.student_id ?? existing.student_id,
    payload.title ?? existing.title,
    payload.description ?? existing.description,
    payload.category ?? existing.category,
    payload.status ?? existing.status,
    payload.priority ?? existing.priority,
    payload.assigned_to ?? existing.assigned_to,
    id
  );

  return getComplaintById(id);
}

export function deleteComplaint(id: number) {
  prepare('DELETE FROM complaints WHERE id = ?').run(id);
  return true;
}

export function addComplaintUpdate(complaintId: number, updatedBy: number | null, message: string, status = 'comment') {
  const result = prepare(
    `INSERT INTO complaint_updates (complaint_id, updated_by, message, status, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
  ).run(complaintId, updatedBy, message, status) as { lastInsertRowid: number };

  return prepare('SELECT * FROM complaint_updates WHERE id = ?').get(Number(result.lastInsertRowid));
}

export function listComplaintUpdates(complaintId: number) {
  return prepare('SELECT * FROM complaint_updates WHERE complaint_id = ? ORDER BY created_at DESC').all(complaintId);
}

const complaintService = { listComplaints, getComplaintById, createComplaint, updateComplaint, deleteComplaint, addComplaintUpdate, listComplaintUpdates };
export default complaintService;
