import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataWithTotalResponse } from '../../../common/http/response.util';
import type { EntriesListQuery } from '../build-entries-query';
import { ListEntriesService } from './list-entries.service';

@Controller('api/v1/entries')
export class ListEntriesController {
  constructor(private readonly listEntriesService: ListEntriesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @CurrentUser() auth: AuthContext,
    @Query() query: EntriesListQuery,
    @Headers('x-company-id') companyId?: string,
  ) {
    const entries = await this.listEntriesService.execute(
      auth.userId,
      companyId,
      query,
    );
    return dataWithTotalResponse(entries, entries.length);
  }
}
