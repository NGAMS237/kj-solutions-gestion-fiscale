'use client';
import { useEffect, useState } from 'react';
import { Topbar } from '@/components/topbar';
import { api } from '@/lib/api';

export default function ParametresPage() {
  const [s, setS] = useState<any>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => { api.get('/settings').then(setS); }, []);

  if (!s) return <div className="p-6">Chargement…</div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.patch('/settings', {
      companyName: s.companyName, address: s.address, city: s.city, province: s.province, postalCode: s.postalCode,
      phone: s.phone, email: s.email, neq: s.neq, tpsNumber: s.tpsNumber, tvqNumber: s.tvqNumber,
      invoicePrefix: s.invoicePrefix, paymentTermDays: Number(s.paymentTermDays),
    });
    setMsg('Enregistré ✓');
    setTimeout(() => setMsg(''), 2000);
  };

  return (
    <>
      <Topbar title="Paramètres entreprise" />
      <div className="p-6 max-w-3xl">
        <form onSubmit={save} className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom de l'entreprise"><input className="input" value={s.companyName ?? ''} onChange={(e) => setS({ ...s, companyName: e.target.value })} /></Field>
            <Field label="Courriel"><input className="input" value={s.email ?? ''} onChange={(e) => setS({ ...s, email: e.target.value })} /></Field>
            <Field label="Téléphone"><input className="input" value={s.phone ?? ''} onChange={(e) => setS({ ...s, phone: e.target.value })} /></Field>
            <Field label="Adresse"><input className="input" value={s.address ?? ''} onChange={(e) => setS({ ...s, address: e.target.value })} /></Field>
            <Field label="Ville"><input className="input" value={s.city ?? ''} onChange={(e) => setS({ ...s, city: e.target.value })} /></Field>
            <Field label="Code postal"><input className="input" value={s.postalCode ?? ''} onChange={(e) => setS({ ...s, postalCode: e.target.value })} /></Field>
            <Field label="NEQ"><input className="input" value={s.neq ?? ''} onChange={(e) => setS({ ...s, neq: e.target.value })} /></Field>
            <Field label="Numéro TPS"><input className="input" value={s.tpsNumber ?? ''} onChange={(e) => setS({ ...s, tpsNumber: e.target.value })} /></Field>
            <Field label="Numéro TVQ"><input className="input" value={s.tvqNumber ?? ''} onChange={(e) => setS({ ...s, tvqNumber: e.target.value })} /></Field>
            <Field label="Préfixe facture"><input className="input" value={s.invoicePrefix ?? 'FACT'} onChange={(e) => setS({ ...s, invoicePrefix: e.target.value })} /></Field>
            <Field label="Délai paiement (jours)"><input className="input" type="number" value={s.paymentTermDays ?? 30} onChange={(e) => setS({ ...s, paymentTermDays: e.target.value })} /></Field>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-emerald-600 text-sm">{msg}</span>
            <button className="btn-primary" type="submit">Enregistrer</button>
          </div>
        </form>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
