import { verifyToken } from '@/lib/utils/crypto';
import { config } from '@/lib/config/env';
import { getUserById, getUserRoles } from '@/lib/services/user.service';

export function parseCookies(cookieHeader: string | null) {
  if (!cookieHeader) return {};
  return Object.fromEntries(cookieHeader.split(';').map(c => {
    const [k, ...v] = c.trim().split('=');
    return [k, decodeURIComponent(v.join('='))];
  }));
}

export function getUserFromRequest(req: Request) {
  const cookieHeader = (req.headers && (req.headers as any).get('cookie')) || null;
  const cookies = parseCookies(cookieHeader);
  const token = cookies[config.COOKIE_NAME];
  if (!token) return null;
  const payload = verifyToken(token as string) as any;
  if (!payload) return null;
  const user = getUserById(Number(payload.userId));
  if (!user) return null;
  const roles = getUserRoles(user.id);
  return { user, roles };
}
