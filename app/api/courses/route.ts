import { NextResponse } from 'next/server';
import { listCourses, createCourse } from '@/lib/services/course.service';

export async function GET() {
  return NextResponse.json(listCourses());
}

export async function POST(req: Request) {
  const body = await req.json();
  const course = createCourse(body);
  return NextResponse.json(course);
}
