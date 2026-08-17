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
import { TasksRepository } from '../tasks.repository';
import { UpdateTaskSprintDto } from './update-task-sprint.dto';

// PATCH /api/v1/tasks/:id/sprint — apenas ADMIN/MANAGER (EMPLOYEE não
// vincula/desvincula sprint). Disponível no workspace pessoal (role
// sempre ADMIN lá), diferente de /assign.
@Controller('api/v1/tasks')
export class UpdateTaskSprintController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly tasksRepo: TasksRepository,
  ) {}

  @Patch(':id/sprint')
  @UseGuards(JwtAuthGuard)
  async updateSprint(
    @CurrentUser() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateTaskSprintDto,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );
    if (workspace.role === company_role.EMPLOYEE) {
      throw new ForbiddenException('sem permissão para esta operação');
    }

    const existing = await this.tasksRepo.getById(id, workspace.workspaceId);
    if (!existing) {
      throw new NotFoundException('tarefa não encontrada');
    }

    // ausente, null ou "" -> null (desvincula); qualquer outra string -> vincula.
    const sprintId = dto.sprintId ? dto.sprintId : null;
    const task = await this.tasksRepo.updateSprint(
      id,
      workspace.workspaceId,
      sprintId,
    );
    return dataResponse(task);
  }
}
