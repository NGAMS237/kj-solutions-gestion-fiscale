import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { decomposeFromTotal, DEFAULT_TPS_RATE, DEFAULT_TVQ_RATE } from '../common/tax/tax.util';

interface CreateExpenseInput {
  date?: Date;
  description: string;
  vendor?: string;
  categoryId: string;
  // Soit on fournit subtotal/tps/tvq directement, soit un total à décomposer
  subtotal?: number;
  tps?: number;
  tvq?: number;
  amount?: number;
  autoDecompose?: boolean; // si true et amount fourni → décompose taxable
  receiptUrl?: string;
  paymentMethod?: any;
  notes?: string;
}

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  list(params?: { from?: Date; to?: Date; categoryId?: string; search?: string }) {
    const where: Prisma.ExpenseWhereInput = {
      ...(params?.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params?.from || params?.to
        ? { date: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
        : {}),
      ...(params?.search
        ? {
            OR: [
              { description: { contains: params.search } },
              { vendor: { contains: params.search } },
            ],
          }
        : {}),
    };
    return this.prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    });
  }

  async get(id: string) {
    const exp = await this.prisma.expense.findUnique({ where: { id }, include: { category: true } });
    if (!exp) throw new NotFoundException('Dépense introuvable');
    return exp;
  }

  async create(input: CreateExpenseInput) {
    let { subtotal = 0, tps = 0, tvq = 0, amount = 0 } = input;

    if (input.autoDecompose && input.amount && !input.subtotal) {
      const d = decomposeFromTotal(input.amount, DEFAULT_TPS_RATE, DEFAULT_TVQ_RATE);
      subtotal = d.subtotal;
      tps = d.tps;
      tvq = d.tvq;
      amount = d.total;
    } else if (!input.amount && (input.subtotal || input.tps || input.tvq)) {
      amount = Number((subtotal + tps + tvq).toFixed(2));
    }

    return this.prisma.expense.create({
      data: {
        date: input.date ?? new Date(),
        description: input.description,
        vendor: input.vendor,
        categoryId: input.categoryId,
        subtotal, tps, tvq, amount,
        paymentMethod: input.paymentMethod ?? 'INTERAC',
        receiptUrl: input.receiptUrl,
        notes: input.notes,
      },
      include: { category: true },
    });
  }

  update(id: string, input: Partial<CreateExpenseInput>) {
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...(input.date ? { date: input.date } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.vendor !== undefined ? { vendor: input.vendor } : {}),
        ...(input.categoryId ? { categoryId: input.categoryId } : {}),
        ...(input.subtotal !== undefined ? { subtotal: input.subtotal } : {}),
        ...(input.tps !== undefined ? { tps: input.tps } : {}),
        ...(input.tvq !== undefined ? { tvq: input.tvq } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.paymentMethod ? { paymentMethod: input.paymentMethod } : {}),
        ...(input.receiptUrl !== undefined ? { receiptUrl: input.receiptUrl } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      include: { category: true },
    });
  }

  remove(id: string) {
    return this.prisma.expense.delete({ where: { id } });
  }

  /** Export CSV pour comptable */
  async toCsv(params?: { from?: Date; to?: Date }) {
    const rows = await this.list(params);
    const head = 'Date,Catégorie,Fournisseur,Description,Sous-total,TPS,TVQ,Total,Méthode';
    const lines = rows.map((r) =>
      [
        r.date.toISOString().slice(0, 10),
        r.category.name,
        (r.vendor ?? '').replace(/[",\n]/g, ' '),
        r.description.replace(/[",\n]/g, ' '),
        r.subtotal, r.tps, r.tvq, r.amount, r.paymentMethod,
      ].join(','),
    );
    return [head, ...lines].join('\n');
  }
}
