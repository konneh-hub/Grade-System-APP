import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { getUserFromRequest } from '@/lib/middleware/auth';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export async function GET(req: Request) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const url = new URL(req.url);
    const parts = url.pathname.split('/');
    const idSegment = parts[parts.length - 2];
    const transcriptId = Number(idSegment);
    if (!transcriptId) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

    const db = getDatabase();
    const t = db.prepare('SELECT * FROM transcripts WHERE id = ?').get(transcriptId) as any;
    if (!t) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    // authorize: allow admin/dean/exam_officer or generated_by or owner
    const allowedRoles = ['admin', 'dean', 'exam_officer'];
    const hasRole = auth.roles.some((r: string) => allowedRoles.includes(r));
    if (!hasRole && auth.user.id !== Number(t.generated_by)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }

    // if a file_path exists and file is present, serve it directly
    if (t.file_path) {
      try {
        const fs = await import('node:fs');
        if (fs.existsSync(t.file_path)) {
          const file = fs.readFileSync(t.file_path);
          return new Response(file, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="transcript-${transcriptId}.pdf"`,
            },
          });
        }
      } catch (e) {
        console.error('Failed to read stored transcript file:', e);
      }
    }

    // fetch basic student info and recent results and generate on demand
    const student = db.prepare('SELECT s.id, u.first_name, u.last_name, s.matric_number FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ?').get(t.student_id) as any;
    const results = db.prepare(
      `SELECT c.code, c.title, r.level, r.academic_session_id, r.ca_score, r.exam_score, r.total_score, r.grade
       FROM results r JOIN courses c ON r.course_id = c.id
       WHERE r.student_id = ? ORDER BY r.academic_session_id, r.level`
    ).all(t.student_id) as any[];

    // generate PDF
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Official Transcript', 20, 20);
    doc.setFontSize(11);
    doc.text(`Name: ${student.first_name} ${student.last_name}`, 20, 34);
    doc.text(`Matric: ${student.matric_number}`, 20, 42);
    doc.text(`Transcript ID: ${t.id}`, 20, 50);

    // Use autotable for neat, multi-page tables
    const head = [['Course Code', 'Title', 'Session', 'Grade']];
    const body = results.map((r: any) => [String(r.code), String(r.title), String(r.academic_session_id), String(r.grade)]);

    // add a header/footer on each page
    (doc as any).autoTable({
      head,
      body,
      startY: 68,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [26, 58, 107], textColor: 255 },
      theme: 'grid',
      didDrawPage: (data: any) => {
        // header
        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text('Official Transcript', data.settings.margin.left, 16);
        // footer with page number
        const pageCount = doc.getNumberOfPages();
        const page = doc.getCurrentPageInfo?.()?.pageNumber ?? doc.getNumberOfPages();
        doc.setFontSize(9);
        const footerText = `Page ${page} of ${pageCount}`;
        doc.text(footerText, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
      },
    });

    // mark generated
    db.prepare('UPDATE transcripts SET status = ?, issued_at = CURRENT_TIMESTAMP WHERE id = ?').run('generated', transcriptId);

    const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
    const buffer = Buffer.from(arrayBuffer);

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="transcript-${transcriptId}.pdf"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate transcript.' }, { status: 500 });
  }
}

