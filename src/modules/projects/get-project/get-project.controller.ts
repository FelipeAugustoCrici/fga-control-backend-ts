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
import { ProjectsRepository } from '../projects.repository';

@Controller('api/v1/projects')
export class GetProjectController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly projectsRepo: ProjectsRepository,
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
    const project = await this.projectsRepo.getById(id, workspace.workspaceId);
    if (!project) {
      throw new NotFoundException('projeto não encontrado');
    }
    return dataResponse(project);
  }
}
