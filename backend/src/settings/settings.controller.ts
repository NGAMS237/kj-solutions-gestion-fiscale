import { Body, Controller, Get, Put } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const updateSchema = z.object({
  companyName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  neq: z.string().optional(),
  tpsNumber: z.string().optional(),
  tvqNumber: z.string().optional(),
  invoicePrefix: z.string().optional(),
  paymentTermDays: z.number().int().positive().optional(),
});

@Controller('settings')
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get()
  get() {
    return this.settings.get();
  }

  @Put()
  update(@Body(new ZodValidationPipe(updateSchema)) body: z.infer<typeof updateSchema>) {
    return this.settings.update(body);
  }
}
