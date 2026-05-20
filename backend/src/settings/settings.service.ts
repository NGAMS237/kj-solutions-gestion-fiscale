import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    return this.prisma.setting.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });
  }

  async update(data: Partial<{
    companyName: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
    email: string;
    neq: string;
    tpsNumber: string;
    tvqNumber: string;
    invoicePrefix: string;
    paymentTermDays: number;
  }>) {
    return this.prisma.setting.update({
      where: { id: 1 },
      data,
    });
  }

  /** Réserve le prochain numéro de facture (auto-incrément + préfixe + année). */
  async nextInvoiceNumber(): Promise<string> {
    const setting = await this.get();
    const updated = await this.prisma.setting.update({
      where: { id: 1 },
      data: { nextInvoiceNum: setting.nextInvoiceNum + 1 },
    });
    const year = new Date().getFullYear();
    return `${setting.invoicePrefix}-${year}-${String(setting.nextInvoiceNum).padStart(4, '0')}`;
  }
}
