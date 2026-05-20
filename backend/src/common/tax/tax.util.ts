/**
 * Calculs TPS/TVQ — Règles Québec 2026
 *
 * Règle fiscale appliquée :
 *   - TPS = 5,000 %     sur le sous-total taxable
 *   - TVQ = 9,975 %     sur le sous-total taxable (PAS sur prix+TPS — règle modernisée 2013)
 *
 * Statuts :
 *   - TAXABLE    : TPS + TVQ
 *   - EXEMPT     : aucune taxe perçue, aucune CTI/RTI possible côté dépenses
 *   - ZERO_RATED : taxable à 0 % (rare — exports), CTI/RTI possibles côté dépenses
 *
 * Tous les montants sont arrondis à 2 décimales avec arrondi banker neutre,
 * mais on conserve la précision interne tant que possible (Decimal côté Prisma).
 */

export type TaxStatusStr = 'TAXABLE' | 'EXEMPT' | 'ZERO_RATED';

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxStatus: TaxStatusStr;
}

export interface ComputedLine extends InvoiceLineInput {
  lineTotal: number;
}

export interface ComputedTotals {
  subtotal: number;     // = somme lineTotal
  taxableBase: number;  // somme des lineTotal taxables
  exemptBase: number;   // somme des lineTotal exonérés
  tps: number;
  tvq: number;
  total: number;
  lines: ComputedLine[];
}

export const DEFAULT_TPS_RATE = 0.05;
export const DEFAULT_TVQ_RATE = 0.09975;

/** Arrondi commercial à 2 décimales (half-away-from-zero, comme Excel). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Calcule les totaux d'une facture à partir d'une liste de lignes.
 */
export function computeInvoiceTotals(
  lines: InvoiceLineInput[],
  tpsRate = DEFAULT_TPS_RATE,
  tvqRate = DEFAULT_TVQ_RATE,
): ComputedTotals {
  const computedLines: ComputedLine[] = lines.map((l) => ({
    ...l,
    lineTotal: round2(l.quantity * l.unitPrice),
  }));

  let taxableBase = 0;
  let exemptBase = 0;

  for (const l of computedLines) {
    if (l.taxStatus === 'TAXABLE') taxableBase += l.lineTotal;
    else exemptBase += l.lineTotal; // EXEMPT et ZERO_RATED n'ajoutent pas de taxes perçues
  }

  taxableBase = round2(taxableBase);
  exemptBase = round2(exemptBase);

  const tps = round2(taxableBase * tpsRate);
  const tvq = round2(taxableBase * tvqRate);
  const subtotal = round2(taxableBase + exemptBase);
  const total = round2(subtotal + tps + tvq);

  return { subtotal, taxableBase, exemptBase, tps, tvq, total, lines: computedLines };
}

/**
 * Décompose un montant TOUT TAXES INCLUSES en (sous-total, TPS, TVQ).
 * Utile pour saisir une dépense quand on n'a que le total et qu'on sait que c'est taxable.
 *
 *   total = subtotal * (1 + tps + tvq)
 *   subtotal = total / (1 + tps + tvq)
 */
export function decomposeFromTotal(
  totalIncl: number,
  tpsRate = DEFAULT_TPS_RATE,
  tvqRate = DEFAULT_TVQ_RATE,
): { subtotal: number; tps: number; tvq: number; total: number } {
  const subtotal = round2(totalIncl / (1 + tpsRate + tvqRate));
  const tps = round2(subtotal * tpsRate);
  const tvq = round2(subtotal * tvqRate);
  // ré-équilibre l'éventuel cent d'arrondi sur le sous-total
  const total = round2(subtotal + tps + tvq);
  const delta = round2(totalIncl - total);
  return { subtotal: round2(subtotal + delta), tps, tvq, total: round2(totalIncl) };
}
