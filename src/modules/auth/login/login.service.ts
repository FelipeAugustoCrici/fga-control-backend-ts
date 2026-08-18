import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { KeycloakService } from '../../../common/auth/keycloak.service';
import {
  AuthTokenIssuerService,
  AuthResponse,
} from '../auth-token-issuer.service';
import { AuthRepository } from '../auth.repository';
import { LoginDto } from './login.dto';

// Réplica de AuthService.Login, com uma diferença de propósito: a
// verificação de senha não é mais local (bcrypt contra users.password_hash)
// — o Keycloak é a única fonte de verdade das credenciais, sem fallback.
// `password_hash` continua existindo na tabela por compatibilidade
// histórica, mas login não lê mais essa coluna.
@Injectable()
export class LoginService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly keycloakService: KeycloakService,
    private readonly tokenIssuer: AuthTokenIssuerService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.authRepo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const passwordMatches = await this.keycloakService.verifyPassword(
      dto.email,
      dto.password,
    );
    if (!passwordMatches) {
      // false (senha errada/usuário não existe no Keycloak) e null
      // (Keycloak fora do ar) tratam igual: sem fallback, login não
      // funciona sem o Keycloak confirmar.
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
