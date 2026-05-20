import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { ClientsModule } from './clients/clients.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ExpensesModule } from './expenses/expenses.module';
import { TaxesModule } from './taxes/taxes.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ActivitiesModule } from './activities/activities.module';
import { RecurringModule } from './recurring/recurring.module';
import { PdfModule } from './pdf/pdf.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    SettingsModule,
    ActivitiesModule,
    ClientsModule,
    InvoicesModule,
    ExpensesModule,
    TaxesModule,
    ReportsModule,
    DashboardModule,
    RecurringModule,
    PdfModule,
  ],
})
export class AppModule {}
