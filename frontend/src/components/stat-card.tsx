'use client';
import { LucideIcon } from 'lucide-react';

export function StatCard({
  label, value, sublabel, icon: Icon, tone = 'default',
}: {
  label: string; value: string; sublabel?: string;
  icon?: LucideIcon; tone?: 'default' | 'success' | 'warn' | 'danger';
}) {
  const tones = {
    default: 'bg-brand-500/10 text-brand-600',
    success: 'bg-emerald-500/10 text-emerald-600',
    warn: 'bg-amber-500/10 text-amber-600',
    danger: 'bg-rose-500/10 text-rose-600',
  } as const;
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-[rgb(var(--muted))]">{label}</div>
          <div className="mt-1 text-2xl font-bold">{value}</div>
          {sublabel && <div className="mt-1 text-xs text-[rgb(var(--muted))]">{sublabel}</div>}
        </div>
        {Icon && <div className={`p-2 rounded-lg ${tones[tone]}`}><Icon className="h-5 w-5" /></div>}
      </div>
    </div>
  );
}
