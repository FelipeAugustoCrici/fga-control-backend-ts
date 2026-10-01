import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { GetMyPermissionsController } from './get-my-permissions/get-my-permissions.controller';
import { GetMyPermissionsService } from './get-my-permissions/get-my-permissions.service';
import { ListPlansController } from './list-plans/list-plans.controller';
import { ListPlansService } from './list-plans/list-plans.service';
import { PlansRepository } from './plans.repository';

@Module({
  imports: [AuthModule],
  controllers: [ListPlansController, GetMyPermissionsController],
  providers: [PlansRepository, ListPlansService, GetMyPermissionsService],
  // Usado por modules/plan-limits (GetMyLimitsController) pra resolver o
  // plano real da empresa (via dono) quando x-company-id está presente.
  exports: [PlansRepository],
})
export class PlansModule {}
