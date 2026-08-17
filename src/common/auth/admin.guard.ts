import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { AuthenticatedRequest } from './jwt-auth.guard';

/**
 * Réplica de internal/middleware/admin.go (AdminOnly). Deve ser usado depois
 * de JwtAuthGuard: @UseGuards(JwtAuthGuard, AdminGuard).
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.auth?.isAdmin) {
      throw new ForbiddenException(
        'acesso negado: apenas administradores podem acessar esta funcionalidade',
      );
    }
    return true;
  }
}
