import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AuthContext, AuthenticatedRequest } from './jwt-auth.guard';

/**
 * Extrai o AuthContext anexado pelo JwtAuthGuard. Uso: método de
 * controller protegido por @UseGuards(JwtAuthGuard) com um parâmetro
 * `@CurrentUser() user: AuthContext`.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.auth;
  },
);
