import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfQuarter, endOfQuarter } from 'date-fns';

@Injectable()
export class TaxesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcule la position TPS/TVQ pour une période donnée.
   * - TPS collectée    = somme tpsAmount des factures PAYÉES (ou facturées selon méthode comptable) de la période
   * - TVQ collectée    = idem
   * - CTI/RTI          = somme TPS/TVQ des dépenses dont la catégorie permet réclamation
   * - À remettre       = collectée - intrants
   *
   * Convention : on utilise les factures de statut PAID, payées dans la période.
   * (Pour méthode "à la facturation" plutôt qu'à l'encaissement, voir la variable basis.)
   */
  async report(params: { from: Date; to: Date; basis?: 'CASH' | 'ACCRUAL' }) {
    const { from, to } = params;
    const basis = params.basis ?? 'CASH';

    const invoiceWhere =
      basis === 'CASH'
        ? { paidAt: { gte: from, lte: to }, status: 'PAID' as const }
        : { issueDate: { gte: from, lte: to }, status: { in: ['SENT', 'PAID', 'OVERDUE'] as any } };

    const [invoices, expenses] = await Promise.all([
      this.prisma.invoice.findMany({
        where: invoiceWhere,
        select: {
          tpsAmount: true, tvqAmount: true,
          taxableBase: true, exemptBase: true, total: true,
          items: { select: { activity: { select: { code: true, name: true, taxStatus: true } }, lineTotal: true } },
        },
      }),
      this.prisma.expense.findMany({
        where: { date: { gte: from, lte: to } },
        include: { category: true },
      }),
    ]);

    let tpsCollected = 0, tvqCollected = 0;
    let revenueTaxable = 0, revenueExempt = 0;
    const byActivity: Record<string, { name: string; taxable: number; exempt: number }> = {};

    for (const inv of invoices) {
      tpsCollected += Number(inv.tpsAmount);
      tvqCollected += Number(inv.tvqAmount);
      revenueTaxable += Number(inv.taxableBase);
      revenueExempt += Number(inv.exemptBase);
      for (const item of inv.items) {
        const k = item.activity?.code ?? 'AUTRE';
        const n = item.activity?.name ?? 'Autre';
        if (!byActivity[k]) byActivity[k] = { name: n, taxable: 0, exempt: 0 };
        if (item.activity?.taxStatus === 'EXEMPT' || item.activity?.taxStatus === 'ZERO_RATED') {
          byActivity[k].exempt += Number(item.lineTotal);
        } else {
          byActivity[k].taxable += Number(item.lineTotal);
        }
      }
    }

    let tpsITC = 0, tvqITR = 0, expenseTotal = 0;
    for (const e of expenses) {
      expenseTotal += Number(e.amount);
      if (e.category.reclaimGST) tpsITC += Number(e.tps);
      if (e.category.reclaimQST) tvqITR += Number(e.tvq);
    }

    return {
      periodStart: from,
      periodEnd: to,
      basis,
      revenue: {
        taxable: round2(revenueTaxable),
        exempt: round2(revenueExempt),
        total: round2(revenueTaxable + revenueExempt),
        byActivity,
      },
      tps: {
        collected: round2(tpsCollected),
        itc: round2(tpsITC),
        remittance: round2(tpsCollected - tpsITC),
      },
      tvq: {
        collected: round2(tvqCollected),
        itr: round2(tvqITR),
        remittance: round2(tvqCollected - tvqITR),
      },
      expenses: { total: round2(expenseTotal) },
    };
  }

  /** Génère un rapport pour le trimestre courant. */
  async currentQuarter() {
    const now = new Date();
    return this.report({ from: startOfQuarter(now), to: endOfQuarter(now) });
  }

  async saveSnapshot(input: {
    from: Date;
    to: Date;
    notes?: string;
  }) {
    const r = await this.report({ from: input.from, to: input.to });
    return this.prisma.taxRecord.upsert({
      where: { periodStart_periodEnd: { periodStart: input.from, periodEnd: input.to } },
      create: {
        periodStart: input.from,
        periodEnd: input.to,
        revenueTaxable: r.revenue.taxable,
        revenueExempt: r.revenue.exempt,
        tpsCollected: r.tps.collected,
        tvqCollected: r.tvq.collected,
        tpsITC: r.tps.itc,
        tvqITR: r.tvq.itr,
        tpsRemittance: r.tps.remittance,
        tvqRemittance: r.tvq.remittance,
        notes: input.notes,
      },
      update: {
        revenueTaxable: r.revenue.taxable,
        revenueExempt: r.revenue.exempt,
        tpsCollected: r.tps.collected,
        tvqCollected: r.tvq.collected,
        tpsITC: r.tps.itc,
        tvqITR: r.tvq.itr,
        tpsRemittance: r.tps.remittance,
        tvqRemittance: r.tvq.remittance,
        notes: input.notes,
      },
    });
  }

  history() {
    return this.prisma.taxRecord.findMany({ orderBy: { periodEnd: 'desc' } });
  }
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
