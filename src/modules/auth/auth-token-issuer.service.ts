import { Injectable } from '@nestjs/common';

import { JwtService } from '../../common/auth/jwt.service';
import { SessionService } from '../../common/auth/session.service';
import { toUserResponse, UserResponse } from './auth.mapper';
import { UserRow } from './auth.repository';

export interface AuthResponse {
  token: string;
  expires_at: Date;
  user: UserResponse;
}

/**
 * Réplica de issueToken() em internal/service/auth_service.go: assina o
 * JWT e persiste a sessão correspondente. Compartilhado por register e
 * login, os dois únicos casos de uso que emitem token.
 */
@Injectable()
export class AuthTokenIssuerService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
  ) {}

  async issue(user: UserRow): Promise<AuthResponse> {
    const { token, expiresAt } = this.jwtService.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      planId: user.plan_id,
    });

    await this.sessionService.create(user.id, token, expiresAt);

    return {
      token,
      expires_at: expiresAt,
      user: toUserResponse(user),
    };
  }
}
