import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/utils/crypto';
import { config } from '@/lib/config/env';

export default function DashboardRedirectPage() {
  const token = cookies().get(config.COOKIE_NAME)?.value;
  if (!token) redirect('/login');

  const payload = verifyToken(token);
  if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
    redirect('/login');
  }

  redirect('/');
}
