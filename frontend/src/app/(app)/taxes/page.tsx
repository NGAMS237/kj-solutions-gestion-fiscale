'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/topbar';
import { api } from '@/lib/api';
import { fmtCAD } from '@/lib/format';

type Report = {
  periodStart: string; periodEnd: string;
  revenue: { taxable: number; exempt: number; total: number; byActivity: Record<string, { name: string; taxable: number; exempt: number }> };
  tps: { collected: number; itc: number; remittance: number };
  tvq: { collected: number; itr: number; remittance: number };
  expenses: { total: number };
};

const today = new Date();
const startQ = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
const endQ = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0);

export default function TaxesPage() {
  const [from, setFrom] = useState(startQ.toISOString().slice(0, 10));
  const [to, setTo] = useState(endQ.toISOString().slice(0, 10));
  const [report, setReport] = useState<Report | null>(null);

  const load = () => api.get<Report>(`/taxes/report?from=${from}&to=${to}`).then(setReport);
  useEffect(() => { load(); }, []);

  return (
    <>
      <Topbar title="TPS / TVQ" />
      <div className="p-6 space-y-4">
        <div className="card p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="label">Du</label>
            <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">Au</label>
            <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={load}>Recalculer</button>
        </div>

        {report && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card title="Revenus taxables" value={fmtCAD(report.revenue.taxable)} />
              <Card title="Revenus exonérés" value={fmtCAD(report.revenue.exempt)} />
              <Card title="Total revenus" value={fmtCAD(report.revenue.total)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-4 space-y-2">
                <div className="text-base font-semibold">TPS (5 %)</div>
                <Row label="TPS perçue" value={fmtCAD(report.tps.collected)} />
                <Row label="CTI (crédit intrants)" value={`− ${fmtCAD(report.tps.itc)}`} />
                <div className="border-t border-[rgb(var(--border))] pt-2">
                  <Row label="À remettre" value={fmtCAD(report.tps.remittance)} bold />
                </div>
              </div>
              <div className="card p-4 space-y-2">
                <div className="text-base font-semibold">TVQ (9.975 %)</div>
                <Row label="TVQ perçue" value={fmtCAD(report.tvq.collected)} />
                <Row label="RTI (remboursement intrants)" value={`− ${fmtCAD(report.tvq.itr)}`} />
                <div className="border-t border-[rgb(var(--border))] pt-2">
                  <Row label="À remettre" value={fmtCAD(report.tvq.remittance)} bold />
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="font-semibold mb-3">Revenus par activité</div>
              <table className="w-full">
                <thead><tr>
                  <th className="table-head">Activité</th>
                  <th className="table-head text-right">Taxable</th>
                  <th className="table-head text-right">Exonéré</th>
                </tr></thead>
                <tbody>
                  {Object.entries(report.revenue.byActivity).map(([k, v]) => (
                    <tr key={k}>
                      <td className="table-cell">{v.name}</td>
                      <td className="table-cell text-right">{fmtCAD(v.taxable)}</td>
                      <td className="table-cell text-right">{fmtCAD(v.exempt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-[rgb(var(--muted))]">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? 'font-bold text-base' : ''}`}>
      <span className="text-[rgb(var(--muted))]">{label}</span>
      <span>{value}</span>
    </div>
  );
}
