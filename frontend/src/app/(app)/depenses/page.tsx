'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/topbar';
import { api } from '@/lib/api';
import { fmtCAD, fmtDate } from '@/lib/format';
import { Plus, Download, Trash2 } from 'lucide-react';

type Category = { id: string; name: string; code: string };
type Expense = {
  id: string; date: string; description: string; vendor?: string;
  subtotal: number; tps: number; tvq: number; amount: number;
  category: { name: string };
};

export default function DepensesPage() {
  const [items, setItems] = useState<Expense[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);

  const load = () => api.get<Expense[]>('/expenses').then(setItems);
  useEffect(() => {
    load();
    api.get<Category[]>('/expense-categories').then(setCats);
  }, []);

  const onDelete = async (id: string) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    await api.del(`/expenses/${id}`);
    load();
  };

  return (
    <>
      <Topbar title="Dépenses" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end gap-2">
          <a className="btn-secondary" href="/api/expenses/export.csv" download><Download className="h-4 w-4" /> Export CSV</a>
          <button className="btn-primary" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Nouvelle dépense</button>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-head">Date</th>
              <th className="table-head">Catégorie</th>
              <th className="table-head">Description</th>
              <th className="table-head">Fournisseur</th>
              <th className="table-head text-right">Sous-total</th>
              <th className="table-head text-right">TPS</th>
              <th className="table-head text-right">TVQ</th>
              <th className="table-head text-right">Total</th>
              <th className="table-head"></th>
            </tr></thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id}>
                  <td className="table-cell">{fmtDate(e.date)}</td>
                  <td className="table-cell">{e.category.name}</td>
                  <td className="table-cell">{e.description}</td>
                  <td className="table-cell">{e.vendor ?? '—'}</td>
                  <td className="table-cell text-right">{fmtCAD(e.subtotal)}</td>
                  <td className="table-cell text-right">{fmtCAD(e.tps)}</td>
                  <td className="table-cell text-right">{fmtCAD(e.tvq)}</td>
                  <td className="table-cell text-right font-medium">{fmtCAD(e.amount)}</td>
                  <td className="table-cell text-right">
                    <button className="btn-ghost text-rose-600" onClick={() => onDelete(e.id)}><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={9} className="table-cell text-center text-[rgb(var(--muted))]">Aucune dépense</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <ExpenseForm cats={cats} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
        )}
      </div>
    </>
  );
}

function ExpenseForm({ cats, onClose, onSaved }: { cats: Category[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '', vendor: '', categoryId: cats[0]?.id ?? '',
    subtotal: 0, tps: 0, tvq: 0, amount: 0,
    autoDecompose: false,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form, date: form.date };
    if (form.autoDecompose) {
      payload.amount = Number(form.amount);
      delete payload.subtotal; delete payload.tps; delete payload.tvq;
    }
    await api.post('/expenses', payload);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-xl p-6 space-y-3">
        <div className="text-lg font-semibold">Nouvelle dépense</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="label">Catégorie</label>
            <select className="input" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <input required className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="label">Fournisseur</label>
          <input className="input" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input id="autoDec" type="checkbox" checked={form.autoDecompose} onChange={(e) => setForm({ ...form, autoDecompose: e.target.checked })} />
          <label htmlFor="autoDec" className="text-sm">Décomposer automatiquement depuis le total (TTC)</label>
        </div>
        {form.autoDecompose ? (
          <div>
            <label className="label">Total payé (taxes incluses)</label>
            <input className="input" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            <div><label className="label">Sous-total</label>
              <input className="input" type="number" step="0.01" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: Number(e.target.value) })} /></div>
            <div><label className="label">TPS</label>
              <input className="input" type="number" step="0.01" value={form.tps} onChange={(e) => setForm({ ...form, tps: Number(e.target.value) })} /></div>
            <div><label className="label">TVQ</label>
              <input className="input" type="number" step="0.01" value={form.tvq} onChange={(e) => setForm({ ...form, tvq: Number(e.target.value) })} /></div>
            <div><label className="label">Total</label>
              <input className="input" type="number" step="0.01" value={form.amount || (form.subtotal + form.tps + form.tvq)} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn-primary">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}
