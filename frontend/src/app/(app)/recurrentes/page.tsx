'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/topbar';
import { api } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { Play } from 'lucide-react';

type Rec = {
  id: string; name: string; interval: string; active: boolean;
  nextRunAt: string; lastRunAt?: string;
  client: { name: string }; activity?: { name: string } | null;
};

const interval: Record<string, string> = { WEEKLY: 'Hebdomadaire', BIWEEKLY: 'Aux 2 semaines', MONTHLY: 'Mensuel', QUARTERLY: 'Trimestriel' };

export default function RecurrentesPage() {
  const [items, setItems] = useState<Rec[]>([]);
  const load = () => api.get<Rec[]>('/recurring').then(setItems);
  useEffect(() => { load(); }, []);

  const runNow = async (id: string) => {
    await api.post(`/recurring/${id}/run`);
    load();
  };

  return (
    <>
      <Topbar title="Facturation récurrente" />
      <div className="p-6 space-y-4">
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-head">Nom</th>
              <th className="table-head">Client</th>
              <th className="table-head">Activité</th>
              <th className="table-head">Fréquence</th>
              <th className="table-head">Prochaine</th>
              <th className="table-head">Dernière</th>
              <th className="table-head">Statut</th>
              <th className="table-head"></th>
            </tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td className="table-cell font-medium">{r.name}</td>
                  <td className="table-cell">{r.client.name}</td>
                  <td className="table-cell">{r.activity?.name ?? '—'}</td>
                  <td className="table-cell">{interval[r.interval]}</td>
                  <td className="table-cell">{fmtDate(r.nextRunAt)}</td>
                  <td className="table-cell">{r.lastRunAt ? fmtDate(r.lastRunAt) : '—'}</td>
                  <td className="table-cell">
                    <span className={`badge ${r.active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 text-slate-500'}`}>
                      {r.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <button className="btn-secondary" onClick={() => runNow(r.id)}><Play className="h-3 w-3" /> Générer</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={8} className="table-cell text-center text-[rgb(var(--muted))]">
                  Aucune récurrence — création via API <code>POST /api/recurring</code> (UI à venir)
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
