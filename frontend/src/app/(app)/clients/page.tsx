'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/topbar';
import { api } from '@/lib/api';
import { Plus, Search, Trash2, Edit3 } from 'lucide-react';

type Client = {
  id: string; name: string; type: 'PARTICULIER' | 'ENTREPRISE' | 'GARDERIE';
  email?: string; phone?: string; city?: string; active: boolean;
  _count?: { invoices: number };
};

const typeLabel: Record<string, string> = {
  PARTICULIER: 'Particulier', ENTREPRISE: 'Entreprise', GARDERIE: 'Garderie',
};
const typeBadge: Record<string, string> = {
  PARTICULIER: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
  ENTREPRISE: 'bg-brand-500/15 text-brand-600',
  GARDERIE: 'bg-amber-500/15 text-amber-600',
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const load = () => api.get<Client[]>(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`).then(setClients);
  useEffect(() => { load(); }, [search]);

  const onDelete = async (id: string) => {
    if (!confirm('Désactiver ce client ?')) return;
    await api.del(`/clients/${id}`);
    load();
  };

  return (
    <>
      <Topbar title="Clients" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[rgb(var(--muted))]" />
            <input className="input pl-9" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="h-4 w-4" /> Nouveau client
          </button>
        </div>

        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead><tr>
              <th className="table-head">Nom</th>
              <th className="table-head">Type</th>
              <th className="table-head">Contact</th>
              <th className="table-head">Ville</th>
              <th className="table-head text-right">Factures</th>
              <th className="table-head"></th>
            </tr></thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td className="table-cell font-medium">{c.name}</td>
                  <td className="table-cell"><span className={`badge ${typeBadge[c.type]}`}>{typeLabel[c.type]}</span></td>
                  <td className="table-cell text-[rgb(var(--muted))]">{c.email || c.phone || '—'}</td>
                  <td className="table-cell">{c.city || '—'}</td>
                  <td className="table-cell text-right">{c._count?.invoices ?? 0}</td>
                  <td className="table-cell text-right">
                    <button className="btn-ghost" onClick={() => { setEditing(c); setShowForm(true); }}><Edit3 className="h-4 w-4" /></button>
                    <button className="btn-ghost text-rose-600" onClick={() => onDelete(c.id)}><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr><td colSpan={6} className="table-cell text-center text-[rgb(var(--muted))]">Aucun client</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <ClientForm
            initial={editing ?? undefined}
            onClose={() => { setShowForm(false); setEditing(null); }}
            onSaved={() => { setShowForm(false); setEditing(null); load(); }}
          />
        )}
      </div>
    </>
  );
}

function ClientForm({ initial, onClose, onSaved }: { initial?: Client; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '', type: initial?.type ?? 'PARTICULIER',
    email: initial?.email ?? '', phone: initial?.phone ?? '', city: initial?.city ?? '',
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initial) await api.patch(`/clients/${initial.id}`, form);
    else await api.post('/clients', form);
    onSaved();
  };
  return (
    <div className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-lg p-6 space-y-3">
        <div className="text-lg font-semibold">{initial ? 'Modifier' : 'Nouveau client'}</div>
        <div>
          <label className="label">Nom</label>
          <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
              <option value="PARTICULIER">Particulier</option>
              <option value="ENTREPRISE">Entreprise</option>
              <option value="GARDERIE">Garderie</option>
            </select>
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Courriel</label>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Ville</label>
          <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn-primary">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}
