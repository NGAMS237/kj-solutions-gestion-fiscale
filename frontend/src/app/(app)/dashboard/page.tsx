'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/topbar';
import { StatCard } from '@/components/stat-card';
import { api } from '@/lib/api';
import { fmtCAD, fmtDate } from '@/lib/format';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Calculator } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

type Summary = {
  kpis: {
    revenueMonth: number; expenseMonth: number; profitMonth: number;
    tpsCollected: number; tvqCollected: number; taxesToRemit: number;
    unpaidCount: number; unpaidTotal: number;
  };
  revenueByActivity: { code: string; name: string; color: string; total: number }[];
  unpaid: { id: string; number: string; client: { name: string }; dueDate: string; amountDue: number }[];
  monthly: { label: string; revenue: number; expense: number; profit: number }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.get<Summary>('/dashboard/summary').then(setData).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="p-6 text-rose-600">Erreur : {err}</div>;
  if (!data) return <div className="p-6 text-[rgb(var(--muted))]">Chargement…</div>;

  return (
    <>
      <Topbar title="Tableau de bord" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Revenus du mois" value={fmtCAD(data.kpis.revenueMonth)} icon={TrendingUp} tone="success" />
          <StatCard label="Dépenses du mois" value={fmtCAD(data.kpis.expenseMonth)} icon={TrendingDown} tone="warn" />
          <StatCard label="Profit net (mois)" value={fmtCAD(data.kpis.profitMonth)} icon={DollarSign} tone="default" />
          <StatCard label="Taxes à remettre"
            value={fmtCAD(data.kpis.taxesToRemit)}
            sublabel={`TPS ${fmtCAD(data.kpis.tpsCollected)} · TVQ ${fmtCAD(data.kpis.tvqCollected)}`}
            icon={Calculator} tone="danger" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-semibold">Revenus & dépenses — 12 derniers mois</div>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={data.monthly}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Revenus" fill="#6366f1" />
                  <Bar dataKey="expense" name="Dépenses" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-4">
            <div className="mb-3 font-semibold">Revenus par activité (mois)</div>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data.revenueByActivity} dataKey="total" nameKey="name" outerRadius={80} label={(d: any) => `${d.name}`}>
                    {data.revenueByActivity.map((a, i) => <Cell key={i} fill={a.color || '#94a3b8'} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmtCAD(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgb(var(--border))]">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="font-semibold">Factures impayées</span>
            <span className="text-xs text-[rgb(var(--muted))]">({data.kpis.unpaidCount} · {fmtCAD(data.kpis.unpaidTotal)})</span>
          </div>
          <table className="w-full">
            <thead><tr>
              <th className="table-head">Numéro</th>
              <th className="table-head">Client</th>
              <th className="table-head">Échéance</th>
              <th className="table-head text-right">Solde dû</th>
            </tr></thead>
            <tbody>
              {data.unpaid.length === 0 && (
                <tr><td colSpan={4} className="table-cell text-center text-[rgb(var(--muted))]">Aucune facture impayée 🎉</td></tr>
              )}
              {data.unpaid.map((i) => (
                <tr key={i.id}>
                  <td className="table-cell font-mono">{i.number}</td>
                  <td className="table-cell">{i.client.name}</td>
                  <td className="table-cell">{fmtDate(i.dueDate)}</td>
                  <td className="table-cell text-right font-medium">{fmtCAD(i.amountDue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
