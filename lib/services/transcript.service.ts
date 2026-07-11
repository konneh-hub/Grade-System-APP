import { prepare } from '@/lib/config/database';

export interface TranscriptRequest {
  id: number;
  student_id: number;
  request_type: string;
  status: string;
  requested_at: string;
  processed_at: string | null;
}

export function getTranscriptRequestsByStudent(studentId: number): TranscriptRequest[] {
  return prepare('SELECT * FROM transcript_requests WHERE student_id = ? ORDER BY requested_at DESC').all(studentId) as TranscriptRequest[];
}

export function getTranscriptRequestById(id: number): TranscriptRequest | null {
  return prepare('SELECT * FROM transcript_requests WHERE id = ?').get(id) as TranscriptRequest | null;
}

export function createTranscriptRequest(payload: {
  student_id: number;
  request_type?: string;
  purpose?: string;
  copies?: number;
  notes?: string;
}) {
  const result = prepare(
    `INSERT INTO transcript_requests (student_id, request_type, status, requested_at)
     VALUES (?, ?, 'pending', CURRENT_TIMESTAMP)`
  ).run(
    payload.student_id,
    payload.request_type || payload.purpose || 'official'
  ) as { lastInsertRowid: number };

  return getTranscriptRequestById(Number(result.lastInsertRowid));
}

export function updateTranscriptRequestStatus(id: number, status: string) {
  const updates: Record<string, unknown> = { status };
  if (status === 'completed') {
    updates.processed_at = 'CURRENT_TIMESTAMP';
  }

  prepare(
    `UPDATE transcript_requests SET status = ?, processed_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE processed_at END WHERE id = ?`
  ).run(status, status === 'completed' ? 1 : 0, id);

  return getTranscriptRequestById(id);
}

const transcriptService = {
  getTranscriptRequestsByStudent,
  getTranscriptRequestById,
  createTranscriptRequest,
  updateTranscriptRequestStatus,
};

export default transcriptService;
