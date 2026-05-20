import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InvoicesService } from '../invoices/invoices.service';
import { addDays, addMonths, addWeeks } from 'date-fns';

@Injectable()
export class RecurringService {
  private readonly logger = new Logger(RecurringService.name);

  constructor(private prisma: PrismaService, private invoices: InvoicesService) {}

  list() {
    return this.prisma.recurringInvoice.findMany({
      include: { client: true, activity: true },
      orderBy: { nextRunAt: 'asc' },
    });
  }

  async create(input: {
    name: string;
    clientId: string;
    activityId?: string;
    interval: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY';
    startDate: Date;
    endDate?: Date;
    itemsJson: any[];
    notes?: string;
    termsText?: string;
    autoSendEmail?: boolean;
  }) {
    return this.prisma.recurringInvoice.create({
      data: {
        name: input.name,
        clientId: input.clientId,
        activityId: input.activityId,
        interval: input.interval,
        startDate: input.startDate,
        endDate: input.endDate,
        nextRunAt: input.startDate,
        // itemsJson est stocké en String pour rester portable SQLite/Postgres
        itemsJson: JSON.stringify(input.itemsJson),
        notes: input.notes,
        termsText: input.termsText,
        autoSendEmail: input.autoSendEmail ?? false,
      },
    });
  }

  update(id: string, input: Partial<Parameters<RecurringService['create']>[0] & { active: boolean }>) {
    return this.prisma.recurringInvoice.update({
      where: { id },
      data: input as any,
    });
  }

  remove(id: string) {
    return this.prisma.recurringInvoice.update({ where: { id }, data: { active: false } });
  }

  /** Exécute manuellement une récurrence (génère la facture maintenant). */
  async runNow(id: string) {
    const r = await this.prisma.recurringInvoice.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Récurrence introuvable');
    return this.generate(r);
  }

  /** Cron : toutes les heures, vérifie les récurrences à exécuter. */
  @Cron(CronExpression.EVERY_HOUR)
  async tick() {
    const now = new Date();
    const due = await this.prisma.recurringInvoice.findMany({
      where: { active: true, nextRunAt: { lte: now }, OR: [{ endDate: null }, { endDate: { gte: now } }] },
    });
    if (due.length) this.logger.log(`Récurrences à exécuter : ${due.length}`);
    for (const r of due) {
      try { await this.generate(r); }
      catch (e) { this.logger.error(`Erreur récurrence ${r.id}: ${(e as Error).message}`); }
    }
  }

  private async generate(r: any) {
    // itemsJson est stocké en String — on le décode ici
    const rawItems = typeof r.itemsJson === 'string' ? JSON.parse(r.itemsJson) : r.itemsJson;
    const items = (rawItems as any[]).map((i) => ({
      description: i.description,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      taxStatus: i.taxStatus,
      activityId: i.activityId ?? r.activityId ?? undefined,
    }));
    const invoice = await this.invoices.create({
      clientId: r.clientId,
      items,
      notes: r.notes,
      termsText: r.termsText,
      status: 'SENT',
    });
    const next = this.computeNext(r.nextRunAt, r.interval);
    await this.prisma.recurringInvoice.update({
      where: { id: r.id },
      data: { lastRunAt: new Date(), nextRunAt: next, invoices: { connect: { id: invoice.id } } },
    });
    return invoice;
  }

  private computeNext(from: Date, interval: string) {
    switch (interval) {
      case 'WEEKLY': return addWeeks(from, 1);
      case 'BIWEEKLY': return addWeeks(from, 2);
      case 'MONTHLY': return addMonths(from, 1);
      case 'QUARTERLY': return addMonths(from, 3);
      default: return addDays(from, 14);
    }
  }
}
