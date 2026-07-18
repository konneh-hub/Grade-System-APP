import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';
export async function POST(req: Request) {
  const guard = requireAuth(req);
  if ('error' in guard) return guard.error;
  return Response.json({ ok: true });
}

