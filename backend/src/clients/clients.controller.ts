import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const clientType = z.enum(['PARTICULIER', 'ENTREPRISE', 'GARDERIE']);

const createSchema = z.object({
  name: z.string().min(1),
  type: clientType.optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial().extend({ active: z.boolean().optional() });

@Controller('clients')
export class ClientsController {
  constructor(private service: ClientsService) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('type') type?: 'PARTICULIER' | 'ENTREPRISE' | 'GARDERIE',
    @Query('active') active?: string,
  ) {
    return this.service.list({
      search,
      type,
      active: active === undefined ? undefined : active === 'true',
    });
  }

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
