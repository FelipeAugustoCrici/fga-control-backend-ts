import { Injectable } from '@nestjs/common';

import { PlansRepository } from '../plans.repository';
import { PlanInfo } from '../plans.types';

// Réplica de PermissionService.GetAllPlans.
@Injectable()
export class ListPlansService {
  constructor(private readonly plansRepo: PlansRepository) {}

  execute(): Promise<PlanInfo[]> {
    return this.plansRepo.getAllPlans();
  }
}
