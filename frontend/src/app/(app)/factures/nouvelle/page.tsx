'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Topbar } from '@/components/topbar';
import { api } from '@/lib/api';
import { fmtCAD } from '@/lib/format';
import { Plus, Trash2 } from 'lucide-react';

type Client = { id: string; name: string; type: string };
type Activity = { id: string; code: string; name: string; taxStatus: 'TAXABLE' | 'EXEMPT' | 'ZERO_RATED' };
type Setting = { tpsRate: number; tvqRate: number };

type Line = {
  description: string; quantity: number; unitPrice: number;
  taxStatus: 'TAXABLE' | 'EXEMPT' | 'ZERO_RATED'; activityId?: string;
};

export default function NouvelleFacturePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [settings, setSettings] = useState<Setting | null>(null);
  const [clientId, setClientId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Line[]>([
    { description: '', quantity: 1, unitPrice: 0, taxStatus: 'TAXABLE' },
  ]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<Client[]>('/clients').then(setClients);
    api.get<Activity[]>('/activities').then(setActivities);
    api.get<Setting>('/settings').then((s) => setSettings({ tpsRate: Number(s.tpsRate), tvqRate: Number(s.tvqRate) }));
  }, []);

  const totals = useMemo(() => {
    const tps = Number(settings?.tpsRate ?? 0.05);
    const tvq = Number(settings?.tvqRate ?? 0.09975);
    let taxable = 0, exempt = 0;
    for (const l of lines) {
      const lt = Number(l.quantity) * Number(l.unitPrice);
      if (l.taxStatus === 'TAXABLE') taxable += lt;
      else exempt += lt;
    }
    const subtotal = taxable + exempt;
    const tpsAmount = +(taxable * tps).toFixed(2);
    const tvqAmount = +(taxable * tvq).toFixed(2);
    return { subtotal, taxable, exempt, tps: tpsAmount, tvq: tvqAmount, total: +(subtotal + tpsAmount + tvqAmount).toFixed(2) };
  }, [lines, settings]);

  const addLine = () => setLines([...lines, { description: '', quantity: 1, unitPrice: 0, taxStatus: 'TAXABLE' }]);
  const updateLine = (idx: number, patch: Partial<Line>) =>
    setLines(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));

  const onActivityChange = (idx: number, activityId: string) => {
    const a = activities.find((x) => x.id === activityId);
    updateLine(idx, { activityId, taxStatus: a?.taxStatus ?? lines[idx].taxStatus });
  };

  const submit = async (status: 'DRAFT' | 'SENT') => {
    if (!clientId) { alert('Sélectionner un client'); return; }
    if (lines.some((l) => !l.description || l.quantity <= 0)) { alert('Compléter toutes les lignes'); return; }
    setBusy(true);
    try {
      const created = await api.post<{ id: string }>('/invoices', {
        clientId,
        issueDate,
        notes,
        status,
        items: lines.map((l) => ({
          description: l.description,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          taxStatus: l.taxStatus,
          activityId: l.activityId,
        })),
      });
      router.push('/factures');
      window.open(`/api/invoices/${created.id}/pdf`, '_blank');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Topbar title="Nouvelle facture" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Client</label>
                <select className="input" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  <option value="">— Choisir —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date d'émission</label>
                <input className="input" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead><tr>
                <th className="table-head">Activité</th>
                <th className="table-head">Description</th>
                <th className="table-head text-right">Qté</th>
                <th className="table-head text-right">Prix unitaire</th>
                <th className="table-head">Taxe</th>
                <th className="table-head text-right">Total</th>
                <th className="table-head"></th>
              </tr></thead>
              <tbody>
                {lines.map((l, idx) => (
                  <tr key={idx}>
                    <td className="table-cell">
                      <select className="input" value={l.activityId ?? ''} onChange={(e) => onActivityChange(idx, e.target.value)}>
                        <option value="">—</option>
                        {activities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </td>
                    <td className="table-cell">
                      <input className="input" value={l.description} onChange={(e) => updateLine(idx, { description: e.target.value })} />
                    </td>
                    <td className="table-cell" style={{ width: 100 }}>
                      <input className="input text-right" type="number" step="0.01" value={l.quantity}
                        onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })} />
                    </td>
                    <td className="table-cell" style={{ width: 130 }}>
                      <input className="input text-right" type="number" step="0.01" value={l.unitPrice}
                        onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value) })} />
                    </td>
                    <td className="table-cell" style={{ width: 130 }}>
                      <select className="input" value={l.taxStatus} onChange={(e) => updateLine(idx, { taxStatus: e.target.value as any })}>
                        <option value="TAXABLE">Taxable</option>
                        <option value="EXEMPT">Exonéré</option>
                        <option value="ZERO_RATED">0 %</option>
                      </select>
                    </td>
                    <td className="table-cell text-right">{fmtCAD(l.quantity * l.unitPrice)}</td>
                    <td className="table-cell text-right">
                      <button className="btn-ghost text-rose-600" onClick={() => removeLine(idx)}><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 border-t border-[rgb(var(--border))]">
              <button className="btn-secondary" onClick={addLine}><Plus className="h-4 w-4" /> Ajouter une ligne</button>
            </div>
          </div>

          <div className="card p-4">
            <label className="label">Notes</label>
            <textarea className="input min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-4 space-y-2">
            <div className="text-sm font-semibold">Récapitulatif</div>
            <Row label="Sous-total taxable" value={fmtCAD(totals.taxable)} />
            {totals.exempt > 0 && <Row label="Sous-total exonéré" value={fmtCAD(totals.exempt)} />}
            <Row label={`TPS (${(Number(settings?.tpsRate ?? 0.05) * 100).toFixed(0)} %)`} value={fmtCAD(totals.tps)} />
            <Row label={`TVQ (${(Number(settings?.tvqRate ?? 0.09975) * 100).toFixed(3)} %)`} value={fmtCAD(totals.tvq)} />
            <div className="border-t border-[rgb(var(--border))] pt-2 mt-2">
              <Row label="Total" value={fmtCAD(totals.total)} bold />
            </div>
          </div>
          <div className="space-y-2">
            <button disabled={busy} className="btn-secondary w-full justify-center" onClick={() => submit('DRAFT')}>
              Enregistrer en brouillon
            </button>
            <button disabled={busy} className="btn-primary w-full justify-center" onClick={() => submit('SENT')}>
              Émettre & générer le PDF
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? 'font-semibold text-base' : 'text-[rgb(var(--muted))]'}`}>
      <span>{label}</span><span className="text-[rgb(var(--text))]">{value}</span>
    </div>
  );
}
