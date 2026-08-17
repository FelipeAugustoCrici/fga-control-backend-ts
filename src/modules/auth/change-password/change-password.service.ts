import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PasswordService } from '../../../common/auth/password.service';
import { AuthRepository } from '../auth.repository';

// Réplica de AuthService.ChangePassword. "Senha atual incorreta" é a
// mensagem que o handler usa para ErrInvalidCreds neste endpoint
// especificamente (diferente da mensagem usada em login).
@Injectable()
export class ChangePasswordService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly passwordService: PasswordService,
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

    const matches = await this.passwordService.compare(
      currentPassword,
      user.password_hash,
    );
    if (!matches) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const newHash = await this.passwordService.hash(newPassword);
    await this.authRepo.updatePassword(userId, newHash);
  }
}
