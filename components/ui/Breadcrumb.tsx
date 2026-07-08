import Link from 'next/link';

type BreadcrumbItem = { label: string; href: string };

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
          {index > 0 && <span className="text-slate-300">/</span>}
          {item.href && item.href !== '#' ? (
            <Link href={item.href} className="font-medium text-slate-600 hover:text-slate-900">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-slate-500">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
