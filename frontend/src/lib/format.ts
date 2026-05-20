export const fmtCAD = (v: number | string) =>
  new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(Number(v ?? 0));

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('fr-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });

export const fmtDateLong = (d: Date | string) =>
  new Date(d).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });

export const fmtPercent = (v: number) =>
  `${(v * 100).toFixed(3).replace(/\.?0+$/, '')} %`;
