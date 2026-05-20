'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/topbar';
import { api } from '@/lib/api';
import { fmtCAD } from '@/lib/format';

type PnL = {
  revenue: { total: number; byActivity: Record<string, { name: string; total: number }> };
  expense: { total: number; byCategory: Record<string, { name: string; total: number }> };
  profit: number;
};

const today = new Date();
const startY = new Date(today.getFullYear(), 0, 1);

export default function RapportsPage() {
  const [from, setFrom] = useState(startY.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const [pnl, setPnl] = useState<PnL | null>(null);

  const load = () => api.get<PnL>(`/reports/pnl?from=${from}&to=${to}`).then(setPnl);
  useEffect(() => { load(); }, []);

  return (
    <>
      <Topbar title="Rapports — Profits & Pertes" />
      <div className="p-6 space-y-4">
        <div className="card p-4 flex flex-wrap items-end gap-3">
          <div><label className="label">Du</label><input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><label className="label">Au</label><input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <button className="btn-primary" onClick={load}>Générer</button>
        </div>

        {pnl && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-4">
              <div className="font-semibold mb-3">Revenus par activité</div>
              <table className="w-full">
                <tbody>
                  {Object.entries(pnl.revenue.byActivity).map(([k, v]) => (
                    <tr key={k}><td className="table-cell">{v.name}</td><td className="table-cell text-right">{fmtCAD(v.total)}</td></tr>
                  ))}
                  <tr className="font-semibold"><td className="table-cell">Total revenus</td><td className="table-cell text-right">{fmtCAD(pnl.revenue.total)}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="card p-4">
              <div className="font-semibold mb-3">Dépenses par catégorie</div>
              <table className="w-full">
                <tbody>
                  {Object.entries(pnl.expense.byCategory).map(([k, v]) => (
                    <tr key={k}><td className="table-cell">{v.name}</td><td className="table-cell text-right">{fmtCAD(v.total)}</td></tr>
                  ))}
                  <tr className="font-semibold"><td className="table-cell">Total dépenses</td><td className="table-cell text-right">{fmtCAD(pnl.expense.total)}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="card p-6 md:col-span-2 flex items-center justify-between">
              <span className="text-lg font-semibold">Profit net</span>
              <span className={`text-3xl font-bold ${pnl.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmtCAD(pnl.profit)}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
