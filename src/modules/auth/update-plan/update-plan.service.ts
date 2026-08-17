import { Injectable, NotFoundException } from '@nestjs/common';

import { toUserResponse, UserResponse } from '../auth.mapper';
import { AuthRepository } from '../auth.repository';

// Réplica de AuthService.UpdatePlan. Não valida se plan_id existe de
// verdade — o Go também não valida (não há FK entre users.plan_id e
// plans.id), então replicamos o mesmo comportamento permissivo.
@Injectable()
export class UpdatePlanService {
  constructor(private readonly authRepo: AuthRepository) {}

  async execute(userId: string, planId: string): Promise<UserResponse> {
    const user = await this.authRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const updated = await this.authRepo.updateUserPlan(userId, planId);
    return toUserResponse(updated);
  }
}
