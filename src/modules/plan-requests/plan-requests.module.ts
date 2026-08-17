import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CreatePlanRequestController } from './create-plan-request/create-plan-request.controller';
import { CreatePlanRequestService } from './create-plan-request/create-plan-request.service';
import { PlanRequestsRepository } from './plan-requests.repository';

@Module({
  imports: [AuthModule],
  controllers: [CreatePlanRequestController],
  providers: [PlanRequestsRepository, CreatePlanRequestService],
})
export class PlanRequestsModule {}
