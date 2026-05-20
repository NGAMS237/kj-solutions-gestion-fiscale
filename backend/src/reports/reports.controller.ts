import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private svc: ReportsService) {}

  @Get('pnl')
  pnl(@Query('from') from: string, @Query('to') to: string, @Query('basis') basis?: 'CASH' | 'ACCRUAL') {
    return this.svc.profitAndLoss({ from: new Date(from), to: new Date(to), basis });
  }
}
