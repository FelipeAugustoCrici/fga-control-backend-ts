import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { company_role } from '../../../generated/prisma/enums';
import { ProjectsRepository } from '../projects.repository';
import { CreateProjectDto } from './create-project.dto';

@Controller('api/v1/projects')
export class CreateProjectController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly projectsRepo: ProjectsRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() auth: AuthContext,
    @Body() dto: CreateProjectDto,
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

    const project = await this.projectsRepo.create({
      workspaceId: workspace.workspaceId,
      workspaceType: workspace.workspaceType,
      createdBy: auth.userId,
      name: dto.name,
      description: dto.description,
      code: dto.code,
      status: dto.status,
      color: dto.color,
      icon: dto.icon,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
    return dataResponse(project);
  }
}
