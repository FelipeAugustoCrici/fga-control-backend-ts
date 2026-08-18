import { Injectable, UnauthorizedException } from '@nestjs/common';

import { KeycloakService } from '../../../common/auth/keycloak.service';
import { PasswordService } from '../../../common/auth/password.service';
import { AuthRepository } from '../auth.repository';

// Réplica de AuthService.ChangePassword. "Senha atual incorreta" é a
// mensagem que o handler usa para ErrInvalidCreds neste endpoint
// especificamente (diferente da mensagem usada em login).
//
// A senha atual é checada contra o Keycloak (não mais bcrypt local) — é o
// que login também faz, então precisa ser a mesma fonte de verdade, senão
// dava pra "confirmar" uma senha atual que na prática já não funciona mais
// pra logar. A senha nova é gravada no Keycloak também; o hash local
// (password_hash) continua sendo atualizado só por compatibilidade
// histórica, login não lê mais essa coluna.
@Injectable()
export class ChangePasswordService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly keycloakService: KeycloakService,
  ) {}

  async execute(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.authRepo.findById(userId);
    if (!user) {
      // Inalcançável na prática (guard já validou o usuário); o Go também
      // não trata esse caso especificamente aqui, cai no 500 genérico.
      throw new Error('usuário não encontrado');
    }

    const matches = await this.keycloakService.verifyPassword(
      user.email,
      currentPassword,
    );
    if (!matches) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    await this.keycloakService.updatePassword(user.email, newPassword);

    const newHash = await this.passwordService.hash(newPassword);
    await this.authRepo.updatePassword(userId, newHash);
  }
}
