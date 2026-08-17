import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { omitEmpty } from '../../common/serialization/nullable';
import { company_role } from '../../generated/prisma/enums';
import type { companiesModel } from '../../generated/prisma/models';
import {
  CompanyMemberResponse,
  CompanyResponse,
  MembershipInfo,
  UserCompanyResponse,
} from './companies.types';

// Réplica de internal/repository/company_repository.go.
@Injectable()
export class CompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithOwnerAsAdmin(
    name: string,
    ownerId: string,
    teamSize: string | null = null,
  ): Promise<CompanyResponse> {
    const company = await this.prisma.$transaction(async (tx) => {
      const created = await tx.companies.create({
        data: { name, owner_id: ownerId, team_size: teamSize },
      });
      await tx.company_members.create({
        data: {
          company_id: created.id,
          user_id: ownerId,
          role: company_role.ADMIN,
        },
      });
      return created;
    });
    return this.toCompanyResponse(company);
  }

  async listByUser(userId: string): Promise<UserCompanyResponse[]> {
    const rows = await this.prisma.company_members.findMany({
      where: { user_id: userId },
      select: { role: true, companies: { select: { id: true, name: true } } },
      orderBy: { companies: { name: 'asc' } },
    });
    return rows.map((row) => ({
      id: row.companies.id,
      name: row.companies.name,
      role: row.role,
    }));
  }

  async isMember(companyId: string, userId: string): Promise<MembershipInfo> {
    const member = await this.prisma.company_members.findUnique({
      where: { company_id_user_id: { company_id: companyId, user_id: userId } },
      select: { role: true },
    });
    return { isMember: !!member, role: member?.role ?? null };
  }

  async listMembers(companyId: string): Promise<CompanyMemberResponse[]> {
    const members = await this.prisma.company_members.findMany({
      where: { company_id: companyId },
      include: { users: { select: { name: true, email: true } } },
    });
    if (members.length === 0) return [];

    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const monthEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const grouped = await this.prisma.task_entries.groupBy({
      by: ['user_id'],
      where: {
        user_id: { in: members.map((m) => m.user_id) },
        date: { gte: monthStart, lt: monthEnd },
      },
      _sum: { time_spent_minutes: true },
    });
    const totalsByUser = new Map(
      grouped
        .filter((g) => g.user_id !== null)
        .map((g) => [g.user_id as string, g._sum.time_spent_minutes ?? 0]),
    );

    const result = members.map((member) => ({
      id: member.id,
      company_id: member.company_id,
      user_id: member.user_id,
      role: member.role,
      created_at: member.created_at,
      name: member.users.name,
      email: member.users.email,
      total_minutes: totalsByUser.get(member.user_id) ?? 0,
    }));

    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }

  async getAdminCompanyId(userId: string): Promise<string | null> {
    const member = await this.prisma.company_members.findFirst({
      where: { user_id: userId, role: company_role.ADMIN },
      select: { company_id: true },
    });
    return member?.company_id ?? null;
  }

  addMember(
    companyId: string,
    userId: string,
    role: company_role,
  ): Promise<unknown> {
    return this.prisma.company_members.upsert({
      where: { company_id_user_id: { company_id: companyId, user_id: userId } },
      create: { company_id: companyId, user_id: userId, role },
      update: { role },
    });
  }

  async getUserIdByEmail(email: string): Promise<string | null> {
    const user = await this.prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });
    return user?.id ?? null;
  }

  // Fallback de compatibilidade para usuários criados antes de
  // company_members existir (checa também users.company_id).
  async isUserInWorkspace(companyId: string, userId: string): Promise<boolean> {
    const [member, user] = await Promise.all([
      this.prisma.company_members.findUnique({
        where: {
          company_id_user_id: { company_id: companyId, user_id: userId },
        },
        select: { user_id: true },
      }),
      this.prisma.users.findFirst({
        where: { id: userId, company_id: companyId },
        select: { id: true },
      }),
    ]);
    return !!member || !!user;
  }

  private toCompanyResponse(row: companiesModel): CompanyResponse {
    return {
      id: row.id,
      name: row.name,
      owner_id: row.owner_id,
      team_size: omitEmpty(row.team_size),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
