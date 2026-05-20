import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.expenseCategory.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  }
  create(data: { code: string; name: string; reclaimGST?: boolean; reclaimQST?: boolean; deductible?: boolean; color?: string }) {
    return this.prisma.expenseCategory.create({ data });
  }
  update(id: string, data: Partial<{ name: string; reclaimGST: boolean; reclaimQST: boolean; deductible: boolean; color: string; active: boolean }>) {
    return this.prisma.expenseCategory.update({ where: { id }, data });
  }
}
