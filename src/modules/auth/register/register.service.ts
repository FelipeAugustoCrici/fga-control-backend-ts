import { ConflictException, Injectable } from '@nestjs/common';

import { PasswordService } from '../../../common/auth/password.service';
import { CompaniesRepository } from '../../companies/companies.repository';
import {
  AuthTokenIssuerService,
  AuthResponse,
} from '../auth-token-issuer.service';
import { AuthRepository } from '../auth.repository';
import { RegisterDto } from './register.dto';

// Réplica de AuthService.Register (internal/service/auth_service.go).
@Injectable()
export class RegisterService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly companiesRepo: CompaniesRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenIssuer: AuthTokenIssuerService,
  ) {}

  async execute(dto: RegisterDto): Promise<AuthResponse> {
    const exists = await this.authRepo.emailExists(dto.email);
    if (exists) {
      throw new ConflictException('e-mail já cadastrado');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    let user = await this.authRepo.createUser({
      name: dto.name,
      email: dto.email,
      passwordHash,
      usageType: dto.usage_type ?? null,
      planId: dto.plan_id ?? null,
    });

    if (dto.usage_type === 'BUSINESS' && dto.company_name) {
      const company = await this.companiesRepo.createWithOwnerAsAdmin(
        dto.company_name,
        user.id,
        dto.team_size ?? null,
      );
      user = await this.authRepo.updateUserCompany(user.id, company.id);
    }

    // invite_code: sem implementação ainda no Go (processInviteCode é um
    // stub que sempre retorna sucesso) — mantido como no-op aqui também.

    return this.tokenIssuer.issue(user);
  }
}
