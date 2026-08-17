import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PasswordService } from '../../../common/auth/password.service';
import {
  AuthTokenIssuerService,
  AuthResponse,
} from '../auth-token-issuer.service';
import { AuthRepository } from '../auth.repository';
import { LoginDto } from './login.dto';

// Réplica de AuthService.Login. As mensagens de erro abaixo são as que o
// authHandler.Login do Go efetivamente devolve — note que "E-mail ou senha
// incorretos" (E maiúsculo) é escrito direto no handler, diferente da
// mensagem do sentinel ErrInvalidCreds ("e-mail..."), então replicamos o
// texto do handler, não o do erro interno.
@Injectable()
export class LoginService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenIssuer: AuthTokenIssuerService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.authRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const passwordMatches = await this.passwordService.compare(
      dto.password,
      user.password_hash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    if (!user.is_active) {
      throw new ForbiddenException(
        'sua conta foi desativada. Entre em contato com o administrador',
      );
    }

    const response = await this.tokenIssuer.issue(user);

    // Atualiza last_activity_at em background, sem atrasar a resposta —
    // réplica do `go func() { ... }()` do Go.
    this.authRepo.updateLastActivity(user.id).catch(() => undefined);

    return response;
  }
}
