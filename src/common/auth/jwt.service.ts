import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

// Mesma duração usada em internal/auth/jwt.go (tokenDuration = 24 * time.Hour).
const TOKEN_DURATION_SECONDS = 24 * 60 * 60;

export interface JwtClaims {
  user_id: string;
  email: string;
  name: string;
  plan_id?: string;
  sub: string;
  iat: number;
  exp: number;
}

export interface JwtUserInput {
  id: string;
  email: string;
  name: string;
  planId: string | null;
}

/**
 * Réplica de internal/auth/jwt.go: HS256, claims customizadas
 * {user_id, email, name, plan_id?} + sub/iat/exp padrão do JWT.
 */
@Injectable()
export class JwtService {
  private secret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET não definida');
    }
    return secret;
  }

  sign(user: JwtUserInput): { token: string; expiresAt: Date } {
    const payload: Record<string, unknown> = {
      user_id: user.id,
      email: user.email,
      name: user.name,
    };
    // omitempty: plan_id só entra no payload quando presente, igual ao Go.
    if (user.planId) {
      payload.plan_id = user.planId;
    }

    const token = jwt.sign(payload, this.secret(), {
      algorithm: 'HS256',
      subject: user.id,
      expiresIn: TOKEN_DURATION_SECONDS,
    });

    const decoded = jwt.decode(token) as { exp: number };
    return { token, expiresAt: new Date(decoded.exp * 1000) };
  }

  verify(token: string): JwtClaims {
    return jwt.verify(token, this.secret(), {
      algorithms: ['HS256'],
    }) as JwtClaims;
  }
}
