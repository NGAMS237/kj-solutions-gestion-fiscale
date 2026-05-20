import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ExpensesService } from './expenses.service';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const createSchema = z.object({
  date: z.string().optional(),
  description: z.string().min(1),
  vendor: z.string().optional(),
  categoryId: z.string().min(1),
  subtotal: z.number().optional(),
  tps: z.number().optional(),
  tvq: z.number().optional(),
  amount: z.number().optional(),
  autoDecompose: z.boolean().optional(),
  paymentMethod: z.string().optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial();

@Controller('expenses')
export class ExpensesController {
  constructor(private service: ExpensesService) {}

  @Get()
  list(@Query('from') from?: string, @Query('to') to?: string, @Query('categoryId') categoryId?: string, @Query('search') search?: string) {
    return this.service.list({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      categoryId, search,
    });
  }

  @Get('export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(@Query('from') from?: string, @Query('to') to?: string, @Res({ passthrough: true }) res?: Response) {
    res?.setHeader('Content-Disposition', `attachment; filename="depenses.csv"`);
    return this.service.toCsv({ from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined });
  }

  @Get(':id') get(@Param('id') id: string) { return this.service.get(id); }

  @Post()
  create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    return this.service.create({ ...body, date: body.date ? new Date(body.date) : undefined });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>) {
    return this.service.update(id, { ...body, date: body.date ? new Date(body.date) : undefined });
  }

  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
