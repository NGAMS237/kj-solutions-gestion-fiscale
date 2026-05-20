import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ClientType } from '../common/enums';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  list(params?: { search?: string; type?: ClientType; active?: boolean }) {
    const where: Prisma.ClientWhereInput = {
      ...(params?.type ? { type: params.type } : {}),
      ...(params?.active !== undefined ? { active: params.active } : {}),
      ...(params?.search
        ? {
            OR: [
              // NB: 'mode: insensitive' retiré pour rester portable SQLite/Postgres
              { name: { contains: params.search } },
              { email: { contains: params.search } },
              { phone: { contains: params.search } },
            ],
          }
        : {}),
    };
    return this.prisma.client.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { invoices: true } } },
    });
  }

  async get(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { issueDate: 'desc' },
          take: 50,
          select: {
            id: true, number: true, status: true, issueDate: true, dueDate: true,
            total: true, amountDue: true,
          },
        },
      },
    });
    if (!client) throw new NotFoundException('Client introuvable');
    return client;
  }

  create(data: {
    name: string; type?: ClientType;
    email?: string; phone?: string;
    address?: string; city?: string; province?: string; postalCode?: string;
    notes?: string;
  }) {
    return this.prisma.client.create({ data });
  }

  update(id: string, data: Partial<Parameters<ClientsService['create']>[0] & { active: boolean }>) {
    return this.prisma.client.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.client.update({ where: { id }, data: { active: false } });
  }
}
