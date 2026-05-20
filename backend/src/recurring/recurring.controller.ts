import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RecurringService } from './recurring.service';

@Controller('recurring')
export class RecurringController {
  constructor(private svc: RecurringService) {}

  @Get() list() { return this.svc.list(); }

  @Post()
  create(@Body() body: any) {
    return this.svc.create({ ...body, startDate: new Date(body.startDate), endDate: body.endDate ? new Date(body.endDate) : undefined });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.svc.update(id, body);
  }

  @Post(':id/run') runNow(@Param('id') id: string) { return this.svc.runNow(id); }
  @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(id); }
}
