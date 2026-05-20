import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { SettingsModule } from '../settings/settings.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [SettingsModule, PdfModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
