import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataWithTotalResponse } from '../../../common/http/response.util';
import type { PeriodQuery } from '../resolve-period';
import { resolvePeriod } from '../resolve-period';
import { WorkDayResponse } from '../workdays.types';
import { ListWorkdaysService } from './list-workdays.service';

// GET /api/v1/workdays?start_date=&end_date=&period= — réplica de
// WorkdayHandler.List.
@Controller('api/v1/workdays')
export class ListWorkdaysController {
  constructor(private readonly listWorkdaysService: ListWorkdaysService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@CurrentUser() auth: AuthContext, @Query() query: PeriodQuery) {
    const resolved = resolvePeriod(query);
    const startDate = resolved.startDate;
    let endDate = resolved.endDate;
    if (!startDate || !endDate) {
      throw new BadRequestException('informe start_date e end_date ou period');
    }

    const today = formatLocalDate(new Date());
    if (endDate > today) {
      endDate = today;
    }

    let workdays: WorkDayResponse[];
    try {
      workdays = await this.listWorkdaysService.execute(
        auth.userId,
        startDate,
        endDate,
      );
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : String(err),
      );
    }

    return dataWithTotalResponse(workdays, workdays.length);
  }
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
