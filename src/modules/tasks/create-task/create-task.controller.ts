import {
  Body,
  Controller,
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
import { TasksRepository } from '../tasks.repository';
import { CreateTaskDto } from './create-task.dto';

// POST /api/v1/tasks — qualquer role pode criar (sem checagem de
// permissão, diferente de update/assign). No workspace pessoal, o
// responsável é sempre forçado para o próprio usuário.
@Controller('api/v1/tasks')
export class CreateTaskController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly tasksRepo: TasksRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() auth: AuthContext,
    @Body() dto: CreateTaskDto,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );

    let assignedUserId = dto.assignedUserId;
    if (workspace.workspaceType === 'PERSONAL') {
      assignedUserId = auth.userId;
    } else if (assignedUserId) {
      await this.tasksRepo.validateAssignee(
        workspace.workspaceId,
        assignedUserId,
      );
    }

    const task = await this.tasksRepo.create({
      workspaceId: workspace.workspaceId,
      createdBy: auth.userId,
      workspaceType: workspace.workspaceType,
      title: dto.title,
      description: dto.description,
      taskType: dto.taskType,
      assignedUserId,
      sprintId: dto.sprintId,
      projectId: dto.projectId,
      priority: dto.priority,
      estimatedHours: dto.estimatedHours ?? 0,
      dueDate: dto.dueDate,
    });
    return dataResponse(task);
  }
}
