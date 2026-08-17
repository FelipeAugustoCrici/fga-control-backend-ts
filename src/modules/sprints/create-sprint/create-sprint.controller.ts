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
import { SprintsRepository } from '../sprints.repository';
import { CreateSprintDto } from './create-sprint.dto';

// POST /api/v1/sprints — apenas ADMIN/MANAGER (EMPLOYEE não cria).
@Controller('api/v1/sprints')
export class CreateSprintController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly sprintsRepo: SprintsRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() auth: AuthContext,
    @Body() dto: CreateSprintDto,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );
    if (workspace.role === company_role.EMPLOYEE) {
      throw new ForbiddenException('sem permissão para esta operação');
    }

    const sprint = await this.sprintsRepo.create({
      workspaceId: workspace.workspaceId,
      createdBy: auth.userId,
      name: dto.name,
      goal: dto.goal,
      projectId: dto.projectId,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });
    return dataResponse(sprint);
  }
}
