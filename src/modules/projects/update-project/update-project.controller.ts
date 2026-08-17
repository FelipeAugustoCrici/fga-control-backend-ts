import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { company_role } from '../../../generated/prisma/enums';
import { ProjectsRepository } from '../projects.repository';
import { UpdateProjectDto } from './update-project.dto';

@Controller('api/v1/projects')
export class UpdateProjectController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly projectsRepo: ProjectsRepository,
  ) {}

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );
    if (
      workspace.workspaceType === 'COMPANY' &&
      workspace.role === company_role.EMPLOYEE
    ) {
      throw new ForbiddenException('sem permissão para esta operação');
    }

    const project = await this.projectsRepo.update(id, workspace.workspaceId, {
      name: dto.name,
      description: dto.description,
      code: dto.code,
      status: dto.status,
      color: dto.color,
      icon: dto.icon,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
    if (!project) {
      throw new NotFoundException('projeto não encontrado');
    }
    return dataResponse(project);
  }
}
