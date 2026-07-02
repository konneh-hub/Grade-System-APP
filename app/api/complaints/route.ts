import { NextResponse } from 'next/server';
import { listComplaints, createComplaint } from '@/lib/services/complaint.service';

export async function GET() {
  return NextResponse.json(listComplaints());
}

export async function POST(req: Request) {
  const body = await req.json();
  const complaint = createComplaint(body);
  return NextResponse.json(complaint);
}
