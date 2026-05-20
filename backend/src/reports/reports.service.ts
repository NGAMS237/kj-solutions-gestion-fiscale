import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /** Rapport pertes & profits (cash basis : factures payées + dépenses datées) */
  async profitAndLoss(params: { from: Date; to: Date; basis?: 'CASH' | 'ACCRUAL' }) {
    const { from, to } = params;
    const basis = params.basis ?? 'CASH';
    const invoiceWhere =
      basis === 'CASH'
        ? { paidAt: { gte: from, lte: to }, status: 'PAID' as const }
        : { issueDate: { gte: from, lte: to } };

    const invoices = await this.prisma.invoice.findMany({
      where: invoiceWhere,
      include: { items: { include: { activity: true } } },
    });
    const expenses = await this.prisma.expense.findMany({
      where: { date: { gte: from, lte: to } },
      include: { category: true },
    });

    const revenueByActivity: Record<string, { name: string; total: number }> = {};
    let revenue = 0;
    for (const inv of invoices) {
      revenue += Number(inv.taxableBase) + Number(inv.exemptBase); // hors taxes
      for (const it of inv.items) {
        const code = it.activity?.code ?? 'AUTRE';
        const name = it.activity?.name ?? 'Autre';
        revenueByActivity[code] = revenueByActivity[code] ?? { name, total: 0 };
        revenueByActivity[code].total += Number(it.lineTotal);
      }
    }

    const expenseByCategory: Record<string, { name: string; total: number }> = {};
    let expenseTotal = 0;
    for (const e of expenses) {
      // Pour le P&L, on déduit le sous-total (hors taxes récupérables)
      // sauf si la catégorie ne permet pas de réclamer → on déduit le total.
      const deductible = e.category.reclaimGST && e.category.reclaimQST ? Number(e.subtotal) : Number(e.amount);
      expenseTotal += deductible;
      const k = e.category.code;
      expenseByCategory[k] = expenseByCategory[k] ?? { name: e.category.name, total: 0 };
      expenseByCategory[k].total += deductible;
    }

    return {
      periodStart: from,
      periodEnd: to,
      basis,
      revenue: { total: round2(revenue), byActivity: revenueByActivity },
      expense: { total: round2(expenseTotal), byCategory: expenseByCategory },
      profit: round2(revenue - expenseTotal),
    };
  }
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
