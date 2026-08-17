import { Module } from '@nestjs/common';

import { ActivateUserController } from './activate-user/activate-user.controller';
import { AdminRepository } from './admin.repository';
import { CountPendingPlanRequestsController } from './count-pending-plan-requests/count-pending-plan-requests.controller';
import { DeactivateUserController } from './deactivate-user/deactivate-user.controller';
import { GetDashboardController } from './get-dashboard/get-dashboard.controller';
import { GetInactiveUsersController } from './get-inactive-users/get-inactive-users.controller';
import { GetNeverUsedUsersController } from './get-never-used-users/get-never-used-users.controller';
import { GetPlanStatsController } from './get-plan-stats/get-plan-stats.controller';
import { GetUserDetailController } from './get-user-detail/get-user-detail.controller';
import { ListPlanRequestsController } from './list-plan-requests/list-plan-requests.controller';
import { ListUsersController } from './list-users/list-users.controller';
import { ReviewPlanRequestController } from './review-plan-request/review-plan-request.controller';
import { UpdateUserPlanController } from './update-user-plan/update-user-plan.controller';

// Todos os controllers exigem JwtAuthGuard + AdminGuard (réplica de
// admin.Use(middleware.AdminOnly(authSvc)) no Go).
//
// Ordem importa: GetInactiveUsersController (users/inactive) e
// GetNeverUsedUsersController (users/never-used) precisam vir ANTES de
// GetUserDetailController (users/:id) — senão "inactive"/"never-used"
// seriam capturados como se fossem um :id.
@Module({
  controllers: [
    GetDashboardController,
    ListUsersController,
    GetInactiveUsersController,
    GetNeverUsedUsersController,
    DeactivateUserController,
    ActivateUserController,
    UpdateUserPlanController,
    GetUserDetailController,
    GetPlanStatsController,
    ListPlanRequestsController,
    CountPendingPlanRequestsController,
    ReviewPlanRequestController,
  ],
  providers: [AdminRepository],
})
export class AdminModule {}
