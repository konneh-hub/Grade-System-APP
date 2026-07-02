import { redirect } from 'next/navigation';

export default async function LegacyAdminCatchAllPage({ params }: Readonly<{ params: Promise<{ slug?: string[] }> }>) {
  const resolved = await params;
  const slug = resolved.slug ?? [];
  const target = slug.length > 0 ? `/admin/${slug.join('/')}` : '/admin';
  redirect(target);
}
