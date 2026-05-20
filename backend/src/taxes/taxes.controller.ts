import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TaxesService } from './taxes.service';

@Controller('taxes')
export class TaxesController {
  constructor(private svc: TaxesService) {}

  @Get('current-quarter')
  current() { return this.svc.currentQuarter(); }

  @Get('report')
  report(@Query('from') from: string, @Query('to') to: string, @Query('basis') basis?: 'CASH' | 'ACCRUAL') {
    return this.svc.report({ from: new Date(from), to: new Date(to), basis });
  }

  @Get('history') history() { return this.svc.history(); }

  @Post('snapshot')
  snapshot(@Body() body: { from: string; to: string; notes?: string }) {
    return this.svc.saveSnapshot({ from: new Date(body.from), to: new Date(body.to), notes: body.notes });
  }
}
