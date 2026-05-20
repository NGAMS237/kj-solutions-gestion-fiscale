import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const taxStatusEnum = z.enum(['TAXABLE', 'EXEMPT', 'ZERO_RATED']);

const createSchema = z.object({
  code: z.string().min(1).max(30).regex(/^[A-Z0-9_]+$/),
  name: z.string().min(1),
  taxStatus: taxStatusEnum,
  color: z.string().optional(),
  description: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().optional(),
  taxStatus: taxStatusEnum.optional(),
  color: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

@Controller('activities')
export class ActivitiesController {
  constructor(private service: ActivitiesService) {}

  @Get() list() { return this.service.list(); }
  @Get(':id') get(@Param('id') id: string) { return this.service.get(id); }

  @Post()
  create(@Body(new ZodValidationPipe(createSchema)) body: z.infer<typeof createSchema>) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>) {
    return this.service.update(id, body);
  }

  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
