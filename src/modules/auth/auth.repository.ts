import { Injectable } from '@nestjs/common';

import type { usersModel } from '../../generated/prisma/models';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  usageType: string | null;
  planId: string | null;
}

/**
 * Queries Prisma compartilhadas pelos casos de uso de modules/auth/.
 * Réplica de internal/repository/auth_repository.go. Lógica de
 * companies/company_members vive em modules/companies/companies.repository.ts
 * (CompaniesModule é importado aqui) — reflete a mesma dependência cruzada
 * que o AuthService do Go tem com CompanyRepository.
 */
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.users.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.users.findUnique({ where: { id } });
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.users.count({ where: { email } });
    return count > 0;
  }

  createUser(input: CreateUserInput) {
    return this.prisma.users.create({
      data: {
        name: input.name,
        email: input.email,
        password_hash: input.passwordHash,
        must_change_password: false,
        usage_type: input.usageType,
        plan_id: input.planId,
      },
    });
  }

  createUserByAdmin(name: string, email: string, passwordHash: string) {
    return this.prisma.users.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        must_change_password: true,
      },
    });
  }

  updatePassword(userId: string, newPasswordHash: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        password_hash: newPasswordHash,
        must_change_password: false,
        updated_at: new Date(),
      },
    });
  }

  updateUserCompany(userId: string, companyId: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { company_id: companyId, updated_at: new Date() },
    });
  }

  updateUserPlan(userId: string, planId: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { plan_id: planId, updated_at: new Date() },
    });
  }

  updateLastActivity(userId: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { last_activity_at: new Date() },
    });
  }
}

export type UserRow = usersModel;
