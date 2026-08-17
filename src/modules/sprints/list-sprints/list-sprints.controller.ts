import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { SprintsRepository } from '../sprints.repository';

@Controller('api/v1/sprints')
export class ListSprintsController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly sprintsRepo: SprintsRepository,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @CurrentUser() auth: AuthContext,
    @Query('status') status: string | undefined,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );
    const sprints = await this.sprintsRepo.list({
      workspaceId: workspace.workspaceId,
      status,
    });
    return dataResponse(sprints);
  }
}
