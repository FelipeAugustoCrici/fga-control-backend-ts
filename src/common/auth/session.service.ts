import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Sessões revogáveis em banco por cima do JWT stateless, igual ao Go:
 * tabela `sessions` guarda sha256(token) hex; logout deleta a linha,
 * permitindo revogar um token antes do seu exp natural.
 */
@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async create(userId: string, token: string, expiresAt: Date): Promise<void> {
    await this.prisma.sessions.create({
      data: {
        user_id: userId,
        token_hash: this.hashToken(token),
        expires_at: expiresAt,
      },
    });
  }

  async isActive(tokenHash: string): Promise<boolean> {
    const session = await this.prisma.sessions.findUnique({
      where: { token_hash: tokenHash },
    });
    return !!session && session.expires_at > new Date();
  }

  async revoke(tokenHash: string): Promise<void> {
    await this.prisma.sessions.deleteMany({ where: { token_hash: tokenHash } });
  }
}
