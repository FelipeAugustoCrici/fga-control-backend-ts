import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { company_role } from '../../../generated/prisma/enums';
import { TasksRepository } from '../tasks.repository';

// GET /api/v1/tasks — funcionário só vê as próprias tasks (onlyMine
// forçado), ADMIN/MANAGER veem todas do workspace.
@Controller('api/v1/tasks')
export class ListTasksController {
  constructor(
    private readonly resolveWorkspace: WorkspaceResolverService,
    private readonly tasksRepo: TasksRepository,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @CurrentUser() auth: AuthContext,
    @Query('status') status: string | undefined,
    @Query('priority') priority: string | undefined,
    @Query('taskType') taskType: string | undefined,
    @Query('sprintId') sprintId: string | undefined,
    @Query('projectId') projectId: string | undefined,
    @Query('assignedUser') assignedUserId: string | undefined,
    @Query('sort_field') sortField: string | undefined,
    @Query('sort_dir') sortDir: string | undefined,
    @Query('overdue') overdue: string | undefined,
    @Query('exceeded') exceeded: string | undefined,
    @Query('noEntries') noEntries: string | undefined,
    @Query('page') pageRaw: string | undefined,
    @Query('per_page') perPageRaw: string | undefined,
    @Headers('x-company-id') companyId?: string,
  ) {
    const workspace = await this.resolveWorkspace.resolve(
      auth.userId,
      companyId,
    );

    let page = Number.parseInt(pageRaw ?? '1', 10);
    if (!Number.isFinite(page) || page < 1) page = 1;
    let perPage = Number.parseInt(perPageRaw ?? '20', 10);
    if (!Number.isFinite(perPage) || perPage < 1 || perPage > 100) perPage = 20;

    const { tasks, total } = await this.tasksRepo.list({
      workspaceId: workspace.workspaceId,
      requesterId: auth.userId,
      requesterRole: workspace.role,
      onlyMine: workspace.role === company_role.EMPLOYEE,
      status,
      priority,
      taskType,
      sprintId,
      projectId,
      assignedUserId,
      sortField,
      sortDir,
      overdue: overdue === 'true',
      exceeded: exceeded === 'true',
      noEntries: noEntries === 'true',
      page,
      perPage,
    });

    return { data: tasks, total, page, per_page: perPage };
  }
}
