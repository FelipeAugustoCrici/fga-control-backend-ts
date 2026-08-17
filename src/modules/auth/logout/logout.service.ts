import { Injectable } from '@nestjs/common';

import { SessionService } from '../../../common/auth/session.service';

// Réplica de AuthService.Logout: revoga a sessão pelo hash do token.
@Injectable()
export class LogoutService {
  constructor(private readonly sessionService: SessionService) {}

  async execute(token: string): Promise<void> {
    await this.sessionService.revoke(this.sessionService.hashToken(token));
  }
}
