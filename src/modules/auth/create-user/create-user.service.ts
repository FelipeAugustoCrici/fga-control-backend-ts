import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { PasswordService } from '../../../common/auth/password.service';
import { company_role } from '../../../generated/prisma/enums';
import { CompaniesRepository } from '../../companies/companies.repository';
import { toUserResponse, UserResponse } from '../auth.mapper';
import { AuthRepository } from '../auth.repository';

const TEMP_PASSWORD = 'temp1234';

export interface CreateUserResult {
  user: UserResponse;
  temporary_password: string;
}

// Réplica de AuthHandler.CreateUser + AuthService.CreateUserByAdmin.
// "companyID" aqui é sempre a empresa em que o CHAMADOR é ADMIN — não
// confundir com o AdminGuard (que checa users.is_admin, um flag de
// plataforma diferente e não usado nesta rota).
@Injectable()
export class CreateUserService {
  constructor(
    private readonly authRepo: AuthRepository,
    private readonly companiesRepo: CompaniesRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(
    callerId: string,
    name: string,
    email: string,
    role: string | undefined,
  ): Promise<CreateUserResult> {
    const companyId = await this.companiesRepo.getAdminCompanyId(callerId);
    if (!companyId) {
      throw new ForbiddenException(
        'você não é administrador de nenhuma empresa',
      );
    }

    const existingUser = await this.authRepo.findByEmail(email);
    if (existingUser) {
      throw new ConflictException(`usuário com e-mail ${email} já existe`);
    }

    const passwordHash = await this.passwordService.hash(TEMP_PASSWORD);
    const user = await this.authRepo.createUserByAdmin(
      name,
      email,
      passwordHash,
    );

    const resolvedRole = (role || 'EMPLOYEE') as company_role;
    await this.companiesRepo.addMember(companyId, user.id, resolvedRole);

    return { user: toUserResponse(user), temporary_password: TEMP_PASSWORD };
  }
}
