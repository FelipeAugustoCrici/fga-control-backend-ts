import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { company_role } from '../../../generated/prisma/enums';
import { TasksRepository } from '../tasks.repository';
import { UpdateTaskDto } from './update-task.dto';

// PUT /api/v1/tasks/:id — funcionário não pode editar (exceto workspace
// pessoal, onde qualquer usuário edita as próprias tasks e o role é
// sempre ADMIN por definição do resolveWorkspace).
@Controller('api/v1/tasks')
export class UpdateTaskController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly tasksRepo: TasksRepository,
  ) {}

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );
    if (
      workspace.workspaceType !== 'PERSONAL' &&
      workspace.role === company_role.EMPLOYEE
    ) {
      throw new ForbiddenException('sem permissão para esta operação');
    }

    const existing = await this.tasksRepo.getById(id, workspace.workspaceId);
    if (!existing) {
      throw new NotFoundException('tarefa não encontrada');
    }

    // null vira undefined (JSON null e chave ausente são indistinguíveis
    // no Go, que usa *string sem trick de duplo ponteiro aqui).
    const assignedUserId = dto.assignedUserId ?? undefined;
    if (workspace.workspaceType !== 'PERSONAL' && assignedUserId) {
      await this.tasksRepo.validateAssignee(
        workspace.workspaceId,
        assignedUserId,
      );
    }

    const task = await this.tasksRepo.update(id, workspace.workspaceId, {
      workspaceId: workspace.workspaceId,
      workspaceType: workspace.workspaceType,
      title: dto.title ?? undefined,
      description: dto.description ?? undefined,
      taskType: dto.taskType ?? undefined,
      assignedUserId,
      sprintId: dto.sprintId ?? undefined,
      projectId: dto.projectId ?? undefined,
      priority: dto.priority ?? undefined,
      estimatedHours: dto.estimatedHours ?? undefined,
      dueDate: dto.dueDate ?? undefined,
    });
    if (!task) {
      throw new NotFoundException('tarefa não encontrada');
    }
    return dataResponse(task);
  }
}
