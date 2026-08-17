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
import { UpdateTaskStatusDto } from './update-task-status.dto';

// PATCH /api/v1/tasks/:id/status — funcionário só altera status das
// próprias tasks (diferente de PUT, que ele nem acessa).
@Controller('api/v1/tasks')
export class UpdateTaskStatusController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly tasksRepo: TasksRepository,
  ) {}

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @CurrentUser() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );

    const existing = await this.tasksRepo.getById(id, workspace.workspaceId);
    if (!existing) {
      throw new NotFoundException('tarefa não encontrada');
    }
    if (
      workspace.role === company_role.EMPLOYEE &&
      existing.assigned_user_id !== auth.userId
    ) {
      throw new ForbiddenException('sem permissão para esta operação');
    }

    const task = await this.tasksRepo.updateStatus(
      id,
      workspace.workspaceId,
      dto.status,
    );
    return dataResponse(task);
  }
}
