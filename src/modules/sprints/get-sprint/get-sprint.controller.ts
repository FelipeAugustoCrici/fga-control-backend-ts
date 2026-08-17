import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { SprintsRepository } from '../sprints.repository';

@Controller('api/v1/sprints')
export class GetSprintController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly sprintsRepo: SprintsRepository,
  ) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async get(
    @CurrentUser() auth: AuthContext,
    @Param('id') id: string,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );
    const sprint = await this.sprintsRepo.getById(id, workspace.workspaceId);
    if (!sprint) {
      throw new NotFoundException('sprint não encontrada');
    }
    return dataResponse(sprint);
  }
}
