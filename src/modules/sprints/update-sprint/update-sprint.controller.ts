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
import { SprintsRepository } from '../sprints.repository';
import { UpdateSprintDto } from './update-sprint.dto';

// PATCH /api/v1/sprints/:id — apenas ADMIN/MANAGER (EMPLOYEE não edita).
@Controller('api/v1/sprints')
export class UpdateSprintController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly sprintsRepo: SprintsRepository,
  ) {}

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateSprintDto,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );
    if (workspace.role === company_role.EMPLOYEE) {
      throw new ForbiddenException('sem permissão para esta operação');
    }

    const sprint = await this.sprintsRepo.update(id, workspace.workspaceId, {
      name: dto.name,
      goal: dto.goal,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: dto.status,
    });
    if (!sprint) {
      throw new NotFoundException('sprint não encontrada');
    }
    return dataResponse(sprint);
  }
}
