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
})
export class PlansModule {}
