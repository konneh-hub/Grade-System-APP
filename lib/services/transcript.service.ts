import { getDatabase, prepare } from '@/lib/config/database';

export interface TranscriptRequest {
  id: number;
  student_id: number;
  request_type: string;
  status: string;
  requested_at: string;
  processed_at: string | null;
}

export interface TranscriptRecord {
  id: number;
  student_id: number;
  transcript_type: string;
  status: string;
  request_id: number | null;
  generated_by: number | null;
  issued_at: string | null;
  file_path: string | null;
  created_at: string;
}

function ensureTranscriptRequestLinkColumn() {
  const db = getDatabase();
  const columns = db.prepare('PRAGMA table_info(transcripts)').all() as Array<{ name: string }>;
  const hasRequestId = columns.some((column) => column.name === 'request_id');
  if (!hasRequestId) {
    db.exec('ALTER TABLE transcripts ADD COLUMN request_id INTEGER REFERENCES transcript_requests(id) ON DELETE SET NULL');
  }
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
  ensureTranscriptRequestLinkColumn();

  if (status === 'completed') {
    prepare(
      `UPDATE transcript_requests
       SET status = ?, processed_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(status, id);

    const request = getTranscriptRequestById(id);
    if (!request) return null;

    const transcriptDb = getDatabase();
    let transcript = transcriptDb
      .prepare('SELECT * FROM transcripts WHERE request_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(id) as TranscriptRecord | null;

    if (!transcript) {
      const transcriptResult = transcriptDb
        .prepare(
          `INSERT INTO transcripts (student_id, transcript_type, status, request_id, generated_by, created_at)
           VALUES (?, ?, 'queued', ?, NULL, CURRENT_TIMESTAMP)`
        )
        .run(request.student_id, request.request_type || 'official', id) as { lastInsertRowid: number };
      transcript = getTranscriptById(Number(transcriptResult.lastInsertRowid));
    }

    return {
      ...request,
      transcript_id: transcript?.id ?? null,
      transcript_status: transcript?.status ?? null,
      transcript_file_path: transcript?.file_path ?? null,
    } as TranscriptRequest & { transcript_id: number | null; transcript_status: string | null; transcript_file_path: string | null };
  }

  prepare(
    `UPDATE transcript_requests SET status = ?, processed_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE processed_at END WHERE id = ?`
  ).run(status, status === 'completed' ? 1 : 0, id);

  return getTranscriptRequestById(id);
}

export function getTranscriptById(id: number): TranscriptRecord | null {
  ensureTranscriptRequestLinkColumn();
  return prepare('SELECT * FROM transcripts WHERE id = ?').get(id) as TranscriptRecord | null;
}


export function getTranscriptByRequestId(requestId: number): TranscriptRecord | null {
  ensureTranscriptRequestLinkColumn();
  return prepare('SELECT * FROM transcripts WHERE request_id = ? ORDER BY created_at DESC LIMIT 1').get(requestId) as TranscriptRecord | null;
}

export function listTranscripts(filters: { studentId?: number; status?: string; limit?: number; offset?: number } = {}): TranscriptRecord[] {
  ensureTranscriptRequestLinkColumn();

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.studentId) {
    conditions.push('student_id = ?');
    params.push(filters.studentId);
  }

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  let sql = 'SELECT * FROM transcripts';
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }
  sql += ' ORDER BY created_at DESC';

  const limit = Number.isFinite(filters.limit ?? NaN) ? filters.limit : 100;
  sql += ' LIMIT ?';
  params.push(limit);

  if (Number.isFinite(filters.offset ?? NaN)) {
    sql += ' OFFSET ?';
    params.push(filters.offset as number);
  }

  return prepare(sql).all(...params) as TranscriptRecord[];
}

export function createTranscriptForRequest(requestId: number, generatedBy?: number | null): TranscriptRecord | null {
  ensureTranscriptRequestLinkColumn();

  const request = getTranscriptRequestById(requestId);
  if (!request) return null;

  const db = getDatabase();
  const existing = getTranscriptByRequestId(requestId);
  if (existing) return existing;

  const result = db
    .prepare(
      `INSERT INTO transcripts (student_id, transcript_type, status, request_id, generated_by, created_at)
       VALUES (?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP)`
    )
    .run(request.student_id, request.request_type || 'official', requestId, generatedBy ?? null) as { lastInsertRowid: number };

  return getTranscriptById(Number(result.lastInsertRowid));
}

const transcriptService = {
  getTranscriptRequestsByStudent,
  getTranscriptRequestById,
  createTranscriptRequest,
  updateTranscriptRequestStatus,
};

export default transcriptService;
