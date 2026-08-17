import { Injectable } from '@nestjs/common';

import { toUserResponse, UserResponse } from '../auth.mapper';
import { AuthRepository } from '../auth.repository';

// Réplica de AuthService.Me.
@Injectable()
export class MeService {
  constructor(private readonly authRepo: AuthRepository) {}

  async execute(userId: string): Promise<UserResponse> {
    const user = await this.authRepo.findById(userId);
    if (!user) {
      // Inalcançável na prática: JwtAuthGuard já garantiu que o usuário
      // existe. O Go também não trata esse caso no handler (cai no 500
      // genérico), replicado aqui deixando o erro subir para o filtro.
      throw new Error('usuário não encontrado');
    }
    return toUserResponse(user);
  }
}
