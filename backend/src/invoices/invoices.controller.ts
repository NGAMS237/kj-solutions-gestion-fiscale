import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { PdfService } from '../pdf/pdf.service';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const itemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number(),
  taxStatus: z.enum(['TAXABLE', 'EXEMPT', 'ZERO_RATED']),
  activityId: z.string().optional(),
});

const createSchema = z.object({
  clientId: z.string().min(1),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  termsText: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  items: z.array(itemSchema).min(1),
});

const updateSchema = createSchema.partial();

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['CASH', 'INTERAC', 'CHEQUE', 'CARD', 'TRANSFER', 'STRIPE', 'MONERIS', 'OTHER']).optional(),
  reference: z.string().optional(),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
});

@Controller('invoices')
export class InvoicesController {
  constructor(private service: InvoicesService, private pdf: PdfService) {}

  @Get()
  list(
    @Query('status') status?: any,
    @Query('clientId') clientId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
  ) {
    return this.service.list({
      status,
      clientId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      search,
    });
  }

  @Get(':id') get(@Param('id') id: string) { return this.service.get(id); }

  @Post()
  create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    return this.service.create({
      ...body,
      issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>) {
    return this.service.update(id, {
      ...body,
      issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    });
  }

  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }

  @Post(':id/send') markSent(@Param('id') id: string) { return this.service.markSent(id); }

  @Post(':id/payments')
  addPayment(@Param('id') id: string, @Body(new ZodValidationPipe(paymentSchema)) body: z.infer<typeof paymentSchema>) {
    return this.service.addPayment(id, { ...body, paidAt: body.paidAt ? new Date(body.paidAt) : undefined });
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Res() res: Response) {
    const invoice = await this.service.get(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.number}.pdf"`);
    await this.pdf.streamInvoice(invoice as any, res);
  }
}
