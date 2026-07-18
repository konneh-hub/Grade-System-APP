import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';
export async function GET(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  return Response.json({ ok: true });
}

