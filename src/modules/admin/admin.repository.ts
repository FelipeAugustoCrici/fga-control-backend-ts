import { Injectable } from '@nestjs/common';

import { toUserResponse } from '../auth/auth.mapper';
import { PrismaService } from '../../common/prisma/prisma.service';
import { omitEmpty } from '../../common/serialization/nullable';
import { Prisma } from '../../generated/prisma/client';
import { PlanRequestResponse } from '../plan-requests/plan-requests.types';
import {
  AdminDashboardStats,
  AdminPlanStats,
  AdminUserDetail,
  AdminUserFilters,
  AdminUserListItem,
} from './admin.types';

// Receita estimada por plano — dois mapas INDEPENDENTES e com chaves
// diferentes ('starter'/'pro'/'enterprise' vs 'personal-starter'/
// 'business-basic'/...), réplica exata da inconsistência do Go entre
// GetDashboardStats e GetPlanStats (não é engano, são tabelas de valores
// "fictícios" hardcoded separadas no admin_repository.go original).
const DASHBOARD_PLAN_REVENUE: Record<string, number> = {
  starter: 29.9,
  pro: 79.9,
  enterprise: 199.9,
};
const PLAN_STATS_REVENUE: Record<string, number> = {
  'personal-starter': 29.9,
  'business-basic': 29.9,
  'personal-pro': 79.9,
  'business-pro': 79.9,
  'business-enterprise': 199.9,
};

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  plan_id: string | null;
  company_id: string | null;
  usage_type: string | null;
  is_admin: boolean;
  is_active: boolean;
  last_activity_at: Date | null;
  created_at: Date;
  company_name: string | null;
  plan_name: string | null;
  status: string;
}

// Allowlist de campos ordenáveis para GET /admin/users. O Go original
// interpola sort_field DIRETO na string SQL via fmt.Sprintf sem nenhuma
// validação — uma injeção de SQL real via query param. Aqui é sempre
// parametrizado/allowlisted; um sort_field desconhecido cai no padrão
// (created_at), que é o comportamento observável mais próximo sem herdar
// a vulnerabilidade.
const USER_SORT_COLUMNS: Record<string, Prisma.Sql> = {
  name: Prisma.sql`u.name`,
  email: Prisma.sql`u.email`,
  created_at: Prisma.sql`u.created_at`,
  last_activity_at: Prisma.sql`u.last_activity_at`,
};

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function buildUsersWhere(f: AdminUserFilters): Prisma.Sql {
  const clauses: Prisma.Sql[] = [];

  if (f.search) {
    const like = `%${f.search}%`;
    clauses.push(Prisma.sql`(u.name ILIKE ${like} OR u.email ILIKE ${like})`);
  }
  if (f.planId) clauses.push(Prisma.sql`u.plan_id = ${f.planId}`);
  if (f.usageType) clauses.push(Prisma.sql`u.usage_type = ${f.usageType}`);
  if (f.companyId)
    clauses.push(Prisma.sql`u.company_id = ${f.companyId}::uuid`);

  // Nota: o filtro de status usa só last_activity_at, inconsistente com o
  // CASE do campo `status` exibido (que checa is_active primeiro) — réplica
  // exata da inconsistência do Go, não uma correção.
  if (f.status === 'active') {
    clauses.push(Prisma.sql`u.last_activity_at >= NOW() - INTERVAL '7 days'`);
  } else if (f.status === 'inactive') {
    clauses.push(
      Prisma.sql`u.last_activity_at < NOW() - INTERVAL '7 days' AND u.last_activity_at IS NOT NULL`,
    );
  } else if (f.status === 'never_used') {
    clauses.push(Prisma.sql`u.last_activity_at IS NULL`);
  }

  if (f.dateFrom) clauses.push(Prisma.sql`u.created_at >= ${f.dateFrom}`);
  if (f.dateTo) clauses.push(Prisma.sql`u.created_at <= ${f.dateTo}`);

  if (clauses.length === 0) return Prisma.empty;
  return Prisma.sql`WHERE ${Prisma.join(clauses, ' AND ')}`;
}

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [
      totalUsers,
      activeUsers,
      totalCompanies,
      inactiveUsers,
      newUsersMonth,
      byPlan,
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.users.count({
        where: { last_activity_at: { gte: daysAgo(30) } },
      }),
      this.prisma.companies.count(),
      this.prisma.users.count({
        where: {
          OR: [
            { last_activity_at: { lt: daysAgo(7) } },
            { last_activity_at: null },
          ],
        },
      }),
      this.prisma.users.count({
        where: { created_at: { gte: startOfMonth() } },
      }),
      this.prisma.users.groupBy({ by: ['plan_id'], _count: { _all: true } }),
    ]);

    const usersByPlan: Record<string, number> = {};
    for (const row of byPlan) {
      const planId = row.plan_id ?? 'free';
      usersByPlan[planId] = (usersByPlan[planId] ?? 0) + row._count._all;
    }
    const revenueByPlan: Record<string, number> = {};
    for (const [planId, count] of Object.entries(usersByPlan)) {
      revenueByPlan[planId] = (DASHBOARD_PLAN_REVENUE[planId] ?? 0) * count;
    }

    return {
      total_users: totalUsers,
      active_users: activeUsers,
      total_companies: totalCompanies,
      users_by_plan: usersByPlan,
      revenue_by_plan: revenueByPlan,
      inactive_users: inactiveUsers,
      new_users_month: newUsersMonth,
    };
  }

  async getUsers(
    filters: AdminUserFilters,
  ): Promise<{ items: AdminUserListItem[]; total: number }> {
    const where = buildUsersWhere(filters);
    const sortColumn = filters.sortField
      ? USER_SORT_COLUMNS[filters.sortField]
      : undefined;
    const orderBy = sortColumn ?? Prisma.sql`u.created_at`;
    const dir = filters.sortDir === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
    const offset = (filters.page - 1) * filters.perPage;

    const [rows, countRows] = await Promise.all([
      this.prisma.$queryRaw<AdminUserRow[]>(Prisma.sql`
        SELECT
          u.id, u.name, u.email, u.plan_id, u.company_id, u.usage_type,
          u.is_admin, u.is_active, u.last_activity_at, u.created_at,
          c.name AS company_name,
          p.name AS plan_name,
          CASE
            WHEN u.is_active = FALSE THEN 'inactive'
            WHEN u.last_activity_at IS NULL THEN 'never_used'
            WHEN u.last_activity_at < NOW() - INTERVAL '7 days' THEN 'inactive'
            ELSE 'active'
          END AS status
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        LEFT JOIN plans p ON u.plan_id = p.id
        ${where}
        ORDER BY ${orderBy} ${dir}
        LIMIT ${filters.perPage} OFFSET ${offset}
      `),
      this.prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
        SELECT COUNT(*) AS count FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        ${where}
      `),
    ]);

    return {
      items: rows.map((row) => this.toUserListItem(row)),
      total: Number(countRows[0]?.count ?? 0n),
    };
  }

  // GetInactiveUsers/GetNeverUsedUsers no Go não fazem SELECT de
  // u.is_active — o campo fica no zero-value (false) em toda linha
  // retornada por essas duas rotas, mesmo para usuários ativos. Réplica
  // exata do bug, não uma correção (ver toUserListItem com forceInactive).
  async getInactiveUsers(days: number): Promise<AdminUserListItem[]> {
    const rows = await this.prisma.$queryRaw<
      Omit<AdminUserRow, 'is_active'>[]
    >(Prisma.sql`
      SELECT
        u.id, u.name, u.email, u.plan_id, u.company_id, u.usage_type,
        u.is_admin, u.last_activity_at, u.created_at,
        c.name AS company_name,
        p.name AS plan_name,
        'inactive' AS status
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.last_activity_at < NOW() - (${`${days} days`})::interval
      ORDER BY u.last_activity_at ASC
    `);
    return rows.map((row) => this.toUserListItem({ ...row, is_active: false }));
  }

  async getNeverUsedUsers(): Promise<AdminUserListItem[]> {
    const rows = await this.prisma.$queryRaw<
      Omit<AdminUserRow, 'is_active'>[]
    >(Prisma.sql`
      SELECT
        u.id, u.name, u.email, u.plan_id, u.company_id, u.usage_type,
        u.is_admin, u.last_activity_at, u.created_at,
        c.name AS company_name,
        p.name AS plan_name,
        'never_used' AS status
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN plans p ON u.plan_id = p.id
      WHERE u.last_activity_at IS NULL
      ORDER BY u.created_at DESC
    `);
    return rows.map((row) => this.toUserListItem({ ...row, is_active: false }));
  }

  // Réplica de um comportamento real (não corrigido) do Go: um userId
  // inexistente aqui vira erro genérico não tratado (sql.ErrNoRows), que
  // no handler cai no `default: 500`. Aqui: lança Error genérico (não
  // NotFoundException) para o filtro global converter em 500 também —
  // mantém o status code idêntico ao Go, mesmo sem replicar a mensagem
  // técnica vazada por ele.
  async getUserDetail(userId: string): Promise<AdminUserDetail> {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('usuário não encontrado');
    }

    let company: AdminUserDetail['company'];
    if (user.company_id) {
      const companyRow = await this.prisma.companies.findUnique({
        where: { id: user.company_id },
      });
      if (companyRow) {
        company = {
          id: companyRow.id,
          name: companyRow.name,
          owner_id: companyRow.owner_id,
          team_size: omitEmpty(companyRow.team_size),
          created_at: companyRow.created_at,
          updated_at: companyRow.updated_at,
        };
      }
    }

    let plan: AdminUserDetail['plan'];
    if (user.plan_id) {
      const planRow = await this.prisma.plans.findUnique({
        where: { id: user.plan_id },
        select: { name: true },
      });
      plan = {
        id: user.plan_id,
        name: planRow?.name ?? user.plan_id,
        price: 0,
        description: '',
        features: null,
      };
    }

    const [totals, summaryRows] = await Promise.all([
      this.prisma.task_entries.aggregate({
        where: { user_id: userId },
        _count: { _all: true },
        _sum: { time_spent_minutes: true },
        _max: { created_at: true },
      }),
      this.prisma.$queryRaw<
        {
          entries_7d: bigint;
          entries_30d: bigint;
          hours_7d: number;
          hours_30d: number;
          days_active: bigint;
        }[]
      >(Prisma.sql`
        SELECT
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) AS entries_7d,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS entries_30d,
          (COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN time_spent_minutes END), 0) / 60.0)::float8 AS hours_7d,
          (COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN time_spent_minutes END), 0) / 60.0)::float8 AS hours_30d,
          COUNT(DISTINCT DATE(created_at)) AS days_active
        FROM task_entries WHERE user_id = ${userId}::uuid
      `),
    ]);
    const summary = summaryRows[0];

    return {
      user: toUserResponse(user),
      company,
      plan,
      total_entries: totals._count._all,
      total_hours: (totals._sum.time_spent_minutes ?? 0) / 60,
      last_entry: omitEmpty(totals._max.created_at ?? undefined),
      activity_summary: {
        entries_last_7_days: Number(summary?.entries_7d ?? 0n),
        entries_last_30_days: Number(summary?.entries_30d ?? 0n),
        hours_last_7_days: summary?.hours_7d ?? 0,
        hours_last_30_days: summary?.hours_30d ?? 0,
        days_active: Number(summary?.days_active ?? 0n),
      },
    };
  }

  async getPlanStats(): Promise<AdminPlanStats[]> {
    const rows = await this.prisma.$queryRaw<
      {
        plan_id: string;
        plan_name: string;
        user_count: bigint;
        active_users: bigint;
        inactive_users: bigint;
      }[]
    >(Prisma.sql`
      SELECT
        p.id AS plan_id,
        p.name AS plan_name,
        COUNT(u.id) AS user_count,
        COUNT(CASE WHEN u.last_activity_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS active_users,
        COUNT(CASE WHEN u.last_activity_at < NOW() - INTERVAL '7 days' OR u.last_activity_at IS NULL THEN 1 END) AS inactive_users
      FROM plans p
      LEFT JOIN users u ON u.plan_id = p.id
      WHERE p.is_active = TRUE
      GROUP BY p.id, p.name
      ORDER BY user_count DESC, p.name
    `);

    return rows.map((row) => ({
      plan_id: row.plan_id,
      plan_name: row.plan_name,
      user_count: Number(row.user_count),
      revenue: (PLAN_STATS_REVENUE[row.plan_id] ?? 0) * Number(row.user_count),
      active_users: Number(row.active_users),
      inactive_users: Number(row.inactive_users),
    }));
  }

  // Sem checagem de existência antes do UPDATE — réplica exata do Go, que
  // sempre retorna sucesso mesmo para um userId inexistente (0 linhas
  // afetadas não gera erro).
  async deactivateUser(userId: string): Promise<void> {
    await this.prisma.users.updateMany({
      where: { id: userId },
      data: { is_active: false, updated_at: new Date() },
    });
  }

  async activateUser(userId: string): Promise<void> {
    await this.prisma.users.updateMany({
      where: { id: userId },
      data: { is_active: true, updated_at: new Date() },
    });
  }

  async updateUserPlan(userId: string, planId: string): Promise<void> {
    await this.prisma.users.updateMany({
      where: { id: userId },
      data: { plan_id: planId, updated_at: new Date() },
    });
  }

  async getPlanRequests(
    status: string | undefined,
  ): Promise<PlanRequestResponse[]> {
    const rows = await this.prisma.plan_requests.findMany({
      where: status ? { status } : undefined,
      include: {
        users_plan_requests_user_idTousers: {
          select: { name: true, email: true },
        },
        plans: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const currentPlanIds = rows
      .map((r) => r.current_plan_id)
      .filter((id): id is string => !!id);
    const currentPlans = currentPlanIds.length
      ? await this.prisma.plans.findMany({
          where: { id: { in: currentPlanIds } },
          select: { id: true, name: true },
        })
      : [];
    const currentPlanNames = new Map(currentPlans.map((p) => [p.id, p.name]));

    return rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.users_plan_requests_user_idTousers.name,
      user_email: row.users_plan_requests_user_idTousers.email,
      current_plan_id: row.current_plan_id,
      current_plan_name: row.current_plan_id
        ? (currentPlanNames.get(row.current_plan_id) ?? null)
        : null,
      requested_plan_id: row.requested_plan_id,
      requested_plan_name: row.plans.name,
      status: row.status,
      note: row.note,
      reviewed_by: row.reviewed_by,
      reviewed_at: row.reviewed_at,
      created_at: row.created_at,
    }));
  }

  // update() (não updateMany) de propósito: lança se o id não existir
  // (P2025), réplica do sql.ErrNoRows do Go em UPDATE...RETURNING sem
  // linha afetada — cai no filtro global como 500 genérico, igual ao Go.
  async reviewPlanRequest(
    requestId: string,
    adminId: string,
    status: string,
    note: string | null,
  ): Promise<void> {
    const updated = await this.prisma.plan_requests.update({
      where: { id: requestId },
      data: { status, note, reviewed_by: adminId, reviewed_at: new Date() },
    });

    if (status === 'approved') {
      await this.updateUserPlan(updated.user_id, updated.requested_plan_id);
    }
  }

  async countPendingPlanRequests(): Promise<number> {
    return this.prisma.plan_requests.count({ where: { status: 'pending' } });
  }

  private toUserListItem(row: AdminUserRow): AdminUserListItem {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      plan_id: row.plan_id,
      plan_name: row.plan_name,
      company_id: row.company_id,
      company_name: row.company_name,
      usage_type: row.usage_type,
      is_admin: row.is_admin,
      is_active: row.is_active,
      last_activity_at: row.last_activity_at,
      created_at: row.created_at,
      status: row.status,
    };
  }
}
