import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

import { PrismaService } from '../prisma/prisma.service';
import { JwtClaims, JwtService } from './jwt.service';
import { SessionService } from './session.service';

export interface AuthContext {
  userId: string;
  email: string;
  name: string;
  planId: string | null;
  isAdmin: boolean;
  claims: JwtClaims;
}

export interface AuthenticatedRequest extends Request {
  auth: AuthContext;
}

/**
 * Réplica dos 4 passos de internal/middleware/auth.go: (1) valida
 * assinatura/expiração do JWT, (2) confere sessão ativa em banco (hash
 * sha256 do token), (3) rebusca o usuário e confere is_active (revoga a
 * sessão e barra com 403 se desativado), (4) anexa o contexto de auth na
 * request. plan_id é sempre relido do banco, nunca confiado no JWT, para
 * que upgrades de plano aprovados por admin valham sem novo login.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const bearer = request.headers.authorization;
    if (!bearer?.startsWith('Bearer ')) {
      throw new UnauthorizedException('token não informado');
    }
    const token = bearer.slice('Bearer '.length);

    let claims: JwtClaims;
    try {
      claims = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('token inválido ou expirado');
    }

    const tokenHash = this.sessionService.hashToken(token);
    if (!(await this.sessionService.isActive(tokenHash))) {
      throw new UnauthorizedException('sessão expirada ou revogada');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: claims.user_id },
    });
    if (!user) {
      throw new UnauthorizedException('usuário não encontrado');
    }

    if (!user.is_active) {
      await this.sessionService.revoke(tokenHash);
      throw new ForbiddenException(
        'sua conta foi desativada. Entre em contato com o administrador',
      );
    }

    request.auth = {
      userId: user.id,
      email: user.email,
      name: user.name,
      planId: user.plan_id,
      isAdmin: user.is_admin,
      claims,
    };

    return true;
  }
}
