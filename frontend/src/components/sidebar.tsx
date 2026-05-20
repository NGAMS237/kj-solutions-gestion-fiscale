'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Receipt, Calculator, BarChart3, Settings, Repeat } from 'lucide-react';
import clsx from 'clsx';

const items = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/factures', label: 'Factures', icon: FileText },
  { href: '/recurrentes', label: 'Récurrentes', icon: Repeat },
  { href: '/depenses', label: 'Dépenses', icon: Receipt },
  { href: '/taxes', label: 'TPS / TVQ', icon: Calculator },
  { href: '/rapports', label: 'Rapports', icon: BarChart3 },
  { href: '/parametres', label: 'Paramètres', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--card))] sticky top-0 h-screen">
      <div className="px-5 py-5 border-b border-[rgb(var(--border))]">
        <div className="text-lg font-bold tracking-tight">Gestion Fiscale</div>
        <div className="text-xs text-[rgb(var(--muted))]">Travailleur autonome · QC</div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href} href={href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-xs text-[rgb(var(--muted))] border-t border-[rgb(var(--border))]">
        v1.0 · MVP
      </div>
    </aside>
  );
}
