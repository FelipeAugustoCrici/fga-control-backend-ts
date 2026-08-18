import { Global, Module } from '@nestjs/common';

import { AdminGuard } from './admin.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from './jwt.service';
import { KeycloakService } from './keycloak.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

/**
 * Peças de auth compartilhadas por todos os módulos de slice (guards,
 * assinatura/verificação de JWT, sessões, senhas). Não contém as rotas de
 * login/register/logout em si — essas vivem em modules/auth/ como casos de
 * uso normais, usando os serviços daqui.
 */
@Global()
@Module({
  providers: [
    JwtService,
    SessionService,
    PasswordService,
    KeycloakService,
    JwtAuthGuard,
    AdminGuard,
  ],
  exports: [
    JwtService,
    SessionService,
    PasswordService,
    KeycloakService,
    JwtAuthGuard,
    AdminGuard,
  ],
})
export class AuthCommonModule {}
