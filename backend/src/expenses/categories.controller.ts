import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ExpenseCategoriesService } from './categories.service';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const createSchema = z.object({
  code: z.string().min(1).regex(/^[A-Z0-9_]+$/),
  name: z.string().min(1),
  reclaimGST: z.boolean().optional(),
  reclaimQST: z.boolean().optional(),
  deductible: z.boolean().optional(),
  color: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().optional(),
  reclaimGST: z.boolean().optional(),
  reclaimQST: z.boolean().optional(),
  deductible: z.boolean().optional(),
  color: z.string().optional(),
  active: z.boolean().optional(),
});

@Controller('expense-categories')
export class ExpenseCategoriesController {
  constructor(private svc: ExpenseCategoriesService) {}

  @Get() list() { return this.svc.list(); }

  @Post()
  create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    return this.svc.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>) {
    return this.svc.update(id, body);
  }
}
