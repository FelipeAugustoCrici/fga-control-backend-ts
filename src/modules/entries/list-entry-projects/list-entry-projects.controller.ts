import { Controller, Get, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { EntriesRepository } from '../entries.repository';

@Controller('api/v1/entries/meta/projects')
export class ListEntryProjectsController {
  constructor(private readonly entriesRepo: EntriesRepository) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@CurrentUser() auth: AuthContext) {
    const projects = await this.entriesRepo.listProjects(auth.userId);
    return dataResponse(projects);
  }
}
