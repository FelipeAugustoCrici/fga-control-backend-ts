import { Injectable } from '@nestjs/common';

import { AuthRepository } from '../../auth/auth.repository';
import { PlanRequestResponse } from '../plan-requests.types';
import { PlanRequestsRepository } from '../plan-requests.repository';

// Réplica de PlanRequestHandler.CreatePlanRequest.
@Injectable()
export class CreatePlanRequestService {
  constructor(
    private readonly planRequestsRepo: PlanRequestsRepository,
    private readonly authRepo: AuthRepository,
  ) {}

  async execute(
    userId: string,
    requestedPlanId: string,
  ): Promise<PlanRequestResponse> {
    const user = await this.authRepo.findById(userId);
    const currentPlanId = user?.plan_id ?? null;
    return this.planRequestsRepo.create(userId, requestedPlanId, currentPlanId);
  }
}
