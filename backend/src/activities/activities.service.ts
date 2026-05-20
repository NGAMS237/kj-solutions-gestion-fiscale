import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaxStatus } from '../common/enums';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  list() {
    return this.prisma.activity.findMany({ orderBy: { name: 'asc' } });
  }

  async get(id: string) {
    const a = await this.prisma.activity.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Activité introuvable');
    return a;
  }

  create(data: { code: string; name: string; taxStatus: TaxStatus; color?: string; description?: string }) {
    return this.prisma.activity.create({ data });
  }

  update(id: string, data: Partial<{ name: string; taxStatus: TaxStatus; color: string; description: string; active: boolean }>) {
    return this.prisma.activity.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.activity.update({ where: { id }, data: { active: false } });
  }
}
