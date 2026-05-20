import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { Prisma } from '@prisma/client';
import { InvoiceStatus, TaxStatus } from '../common/enums';
import { computeInvoiceTotals } from '../common/tax/tax.util';
import { addDays } from 'date-fns';

interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  taxStatus: 'TAXABLE' | 'EXEMPT' | 'ZERO_RATED';
  activityId?: string;
}

interface CreateInvoiceInput {
  clientId: string;
  issueDate?: Date;
  dueDate?: Date;
  notes?: string;
  termsText?: string;
  status?: InvoiceStatus;
  items: InvoiceItemInput[];
}

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  async list(params?: {
    status?: InvoiceStatus;
    clientId?: string;
    from?: Date;
    to?: Date;
    search?: string;
  }) {
    const where: Prisma.InvoiceWhereInput = {
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.clientId ? { clientId: params.clientId } : {}),
      ...(params?.from || params?.to
        ? { issueDate: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
        : {}),
      ...(params?.search
        ? {
            OR: [
              { number: { contains: params.search } },
              { client: { name: { contains: params.search } } },
            ],
          }
        : {}),
    };
    return this.prisma.invoice.findMany({
      where,
      include: { client: true, items: true },
      orderBy: { issueDate: 'desc' },
    });
  }

  async get(id: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: { client: true, items: { include: { activity: true }, orderBy: { order: 'asc' } }, payments: true },
    });
    if (!inv) throw new NotFoundException('Facture introuvable');
    return inv;
  }

  async create(input: CreateInvoiceInput) {
    if (!input.items?.length) throw new BadRequestException('Au moins une ligne est requise');

    const settings = await this.settings.get();
    const tpsRate = Number(settings.tpsRate);
    const tvqRate = Number(settings.tvqRate);

    const computed = computeInvoiceTotals(
      input.items.map((i) => ({
        description: i.description,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        taxStatus: i.taxStatus,
      })),
      tpsRate,
      tvqRate,
    );

    const number = await this.settings.nextInvoiceNumber();
    const issueDate = input.issueDate ?? new Date();
    const dueDate = input.dueDate ?? addDays(issueDate, settings.paymentTermDays);

    return this.prisma.invoice.create({
      data: {
        number,
        status: input.status ?? InvoiceStatus.DRAFT,
        clientId: input.clientId,
        issueDate,
        dueDate,
        notes: input.notes,
        termsText: input.termsText,
        subtotal: computed.subtotal,
        taxableBase: computed.taxableBase,
        exemptBase: computed.exemptBase,
        tpsAmount: computed.tps,
        tvqAmount: computed.tvq,
        total: computed.total,
        amountDue: computed.total,
        tpsRate,
        tvqRate,
        items: {
          create: computed.lines.map((l, idx) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxStatus: l.taxStatus as TaxStatus,
            lineTotal: l.lineTotal,
            activityId: input.items[idx].activityId,
            order: idx + 1,
          })),
        },
      },
      include: { client: true, items: true },
    });
  }

  async update(id: string, input: Partial<CreateInvoiceInput> & { status?: InvoiceStatus }) {
    const existing = await this.prisma.invoice.findUnique({ where: { id }, include: { items: true } });
    if (!existing) throw new NotFoundException('Facture introuvable');
    if (existing.status === 'PAID') throw new BadRequestException('Une facture payée ne peut être modifiée');

    if (input.items) {
      const settings = await this.settings.get();
      const tpsRate = Number(existing.tpsRate);
      const tvqRate = Number(existing.tvqRate);
      const computed = computeInvoiceTotals(
        input.items.map((i) => ({
          description: i.description,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          taxStatus: i.taxStatus,
        })),
        tpsRate,
        tvqRate,
      );

      // remplace les items + recalcule
      return this.prisma.$transaction(async (tx) => {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
        return tx.invoice.update({
          where: { id },
          data: {
            ...(input.clientId ? { clientId: input.clientId } : {}),
            ...(input.issueDate ? { issueDate: input.issueDate } : {}),
            ...(input.dueDate ? { dueDate: input.dueDate } : {}),
            ...(input.notes !== undefined ? { notes: input.notes } : {}),
            ...(input.termsText !== undefined ? { termsText: input.termsText } : {}),
            ...(input.status ? { status: input.status } : {}),
            subtotal: computed.subtotal,
            taxableBase: computed.taxableBase,
            exemptBase: computed.exemptBase,
            tpsAmount: computed.tps,
            tvqAmount: computed.tvq,
            total: computed.total,
            amountDue: computed.total.valueOf() - Number(existing.amountPaid),
            items: {
              create: computed.lines.map((l, idx) => ({
                description: l.description,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                taxStatus: l.taxStatus as TaxStatus,
                lineTotal: l.lineTotal,
                activityId: input.items![idx].activityId,
                order: idx + 1,
              })),
            },
          },
          include: { client: true, items: true },
        });
      });
    }

    // pas de changement des items — métadonnées seulement
    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...(input.clientId ? { clientId: input.clientId } : {}),
        ...(input.issueDate ? { issueDate: input.issueDate } : {}),
        ...(input.dueDate ? { dueDate: input.dueDate } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.termsText !== undefined ? { termsText: input.termsText } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
      include: { client: true, items: true },
    });
  }

  async remove(id: string) {
    const inv = await this.prisma.invoice.findUnique({ where: { id } });
    if (!inv) throw new NotFoundException('Facture introuvable');
    if (inv.status === 'PAID') throw new BadRequestException('Une facture payée ne peut être supprimée');
    return this.prisma.invoice.delete({ where: { id } });
  }

  async markSent(id: string) {
    return this.prisma.invoice.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
    });
  }

  async addPayment(
    invoiceId: string,
    payment: { amount: number; method?: any; reference?: string; paidAt?: Date; notes?: string },
  ) {
    const inv = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!inv) throw new NotFoundException('Facture introuvable');

    const newPaid = Number(inv.amountPaid) + Number(payment.amount);
    const newDue = Math.max(0, Number(inv.total) - newPaid);
    const status: InvoiceStatus = newDue <= 0.005 ? 'PAID' : inv.status === 'DRAFT' ? 'SENT' : inv.status;

    return this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          invoiceId,
          amount: payment.amount,
          method: payment.method ?? 'INTERAC',
          reference: payment.reference,
          paidAt: payment.paidAt ?? new Date(),
          notes: payment.notes,
        },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newPaid,
          amountDue: newDue,
          status,
          ...(status === 'PAID' ? { paidAt: new Date() } : {}),
        },
      }),
    ]);
  }
}
