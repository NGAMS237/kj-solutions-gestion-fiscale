'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/topbar';
import { api } from '@/lib/api';
import { fmtCAD, fmtDate } from '@/lib/format';
import { Plus, Download, Eye } from 'lucide-react';

type Invoice = {
  id: string; number: string; status: string;
  issueDate: string; dueDate: string;
  client: { name: string };
  total: number; amountDue: number;
};

const statusLabel: Record<string, { txt: string; cls: string }> = {
  DRAFT:     { txt: 'Brouillon', cls: 'bg-slate-500/15 text-slate-600' },
  SENT:      { txt: 'Envoyée',   cls: 'bg-brand-500/15 text-brand-600' },
  PAID:      { txt: 'Payée',     cls: 'bg-emerald-500/15 text-emerald-600' },
  OVERDUE:   { txt: 'En retard', cls: 'bg-rose-500/15 text-rose-600' },
  CANCELLED: { txt: 'Annulée',   cls: 'bg-slate-500/15 text-slate-400' },
};

export default function FacturesPage() {
  const [items, setItems] = useState<Invoice[]>([]);
  useEffect(() => { api.get<Invoice[]>('/invoices').then(setItems); }, []);
  return (
    <>
      <Topbar title="Factures" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Link href="/factures/nouvelle" className="btn-primary"><Plus className="h-4 w-4" /> Nouvelle facture</Link>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-head">Numéro</th>
              <th className="table-head">Client</th>
              <th className="table-head">Émise</th>
              <th className="table-head">Échéance</th>
              <th className="table-head text-right">Total</th>
              <th className="table-head text-right">Solde dû</th>
              <th className="table-head">Statut</th>
              <th className="table-head"></th>
            </tr></thead>
            <tbody>
              {items.map((i) => {
                const s = statusLabel[i.status] ?? { txt: i.status, cls: '' };
                return (
                  <tr key={i.id}>
                    <td className="table-cell font-mono">{i.number}</td>
                    <td className="table-cell">{i.client.name}</td>
                    <td className="table-cell">{fmtDate(i.issueDate)}</td>
                    <td className="table-cell">{fmtDate(i.dueDate)}</td>
                    <td className="table-cell text-right">{fmtCAD(i.total)}</td>
                    <td className="table-cell text-right font-medium">{fmtCAD(i.amountDue)}</td>
                    <td className="table-cell"><span className={`badge ${s.cls}`}>{s.txt}</span></td>
                    <td className="table-cell text-right">
                      <a className="btn-ghost" href={`/api/invoices/${i.id}/pdf`} target="_blank" rel="noopener"><Eye className="h-4 w-4" /></a>
                      <a className="btn-ghost" href={`/api/invoices/${i.id}/pdf`} download><Download className="h-4 w-4" /></a>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={8} className="table-cell text-center text-[rgb(var(--muted))]">Aucune facture</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
