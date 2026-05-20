import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { startOfMonth, endOfMonth, startOfYear, subMonths, format } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async summary() {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const yearStart = startOfYear(now);

    const [invoicesMonth, expensesMonth, unpaid, byActivityMonth, monthly] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { issueDate: { gte: monthStart, lte: monthEnd } },
        select: { total: true, tpsAmount: true, tvqAmount: true, status: true, amountDue: true },
      }),
      this.prisma.expense.aggregate({
        where: { date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true, tps: true, tvq: true },
      }),
      this.prisma.invoice.findMany({
        where: { status: { in: ['SENT', 'OVERDUE'] }, amountDue: { gt: 0 } },
        include: { client: { select: { name: true } } },
        orderBy: { dueDate: 'asc' },
        take: 20,
      }),
      this.prisma.invoiceItem.groupBy({
        by: ['activityId'],
        where: { invoice: { issueDate: { gte: monthStart, lte: monthEnd } } },
        _sum: { lineTotal: true },
      }),
      this.monthlySeries(now),
    ]);

    const revenueMonth = invoicesMonth.reduce((s, i) => s + Number(i.total), 0);
    const tpsCollected = invoicesMonth.reduce((s, i) => s + Number(i.tpsAmount), 0);
    const tvqCollected = invoicesMonth.reduce((s, i) => s + Number(i.tvqAmount), 0);
    const expenseMonth = Number(expensesMonth._sum.amount ?? 0);
    const profitMonth = revenueMonth - expenseMonth;

    // Activités : récupère noms
    const activities = await this.prisma.activity.findMany({ select: { id: true, code: true, name: true, color: true } });
    const actMap = new Map(activities.map((a) => [a.id, a]));
    const revenueByActivity = byActivityMonth.map((row) => ({
      activityId: row.activityId,
      code: row.activityId ? actMap.get(row.activityId)?.code : 'AUTRE',
      name: row.activityId ? actMap.get(row.activityId)?.name : 'Autre',
      color: row.activityId ? actMap.get(row.activityId)?.color : '#94a3b8',
      total: Number(row._sum.lineTotal ?? 0),
    }));

    return {
      now,
      month: { start: monthStart, end: monthEnd },
      kpis: {
        revenueMonth,
        expenseMonth,
        profitMonth,
        tpsCollected,
        tvqCollected,
        taxesToRemit: tpsCollected + tvqCollected - Number(expensesMonth._sum.tps ?? 0) - Number(expensesMonth._sum.tvq ?? 0),
        unpaidCount: unpaid.length,
        unpaidTotal: unpaid.reduce((s, i) => s + Number(i.amountDue), 0),
      },
      revenueByActivity,
      unpaid,
      monthly,
    };
  }

  private async monthlySeries(ref: Date) {
    const months: { label: string; revenue: number; expense: number; profit: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(ref, i);
      const s = startOfMonth(d);
      const e = endOfMonth(d);
      const inv = await this.prisma.invoice.aggregate({
        where: { issueDate: { gte: s, lte: e } },
        _sum: { total: true },
      });
      const exp = await this.prisma.expense.aggregate({
        where: { date: { gte: s, lte: e } },
        _sum: { amount: true },
      });
      const revenue = Number(inv._sum.total ?? 0);
      const expense = Number(exp._sum.amount ?? 0);
      months.push({
        label: format(d, 'yyyy-MM'),
        revenue,
        expense,
        profit: revenue - expense,
      });
    }
    return months;
  }
}
