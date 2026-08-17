import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { formatDateOnly } from '../../common/serialization/date';
import { omitEmpty } from '../../common/serialization/nullable';
import { Prisma } from '../../generated/prisma/client';
import { project_status } from '../../generated/prisma/enums';
import {
  CreateProjectInput,
  ProjectFilters,
  ProjectResponse,
  UpdateProjectInput,
} from './projects.types';

interface ProjectRawRow {
  id: string;
  workspace_id: string;
  workspace_type: string;
  name: string;
  description: string | null;
  code: string | null;
  status: string;
  color: string | null;
  icon: string | null;
  created_by: string;
  start_date: string | null;
  end_date: string | null;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
  total_tasks: number;
  total_sprints: number;
  total_hours: number;
  total_amount: number;
}

/**
 * Réplica de internal/repository/project_repository.go — usa $queryRaw
 * deliberadamente para List/GetByID/RecalculateHours, porque a agregação
 * (LEFT JOIN com tasks/sprints/task_entries, FILTER por período, match de
 * task_entries por nome quando project_id é nulo) não é razoavelmente
 * expressável no query builder do Prisma sem arriscar divergir do SQL
 * original. Os parâmetros são todos interpolados via Prisma.sql
 * (parametrizado, não concatenação de string — seguro contra injection).
 *
 * ⚠️ Quirks do Go replicados de propósito, não corrigidos:
 * 1. `total_amount` NUNCA decripta — soma só quando o texto bate com
 *    `^[0-9]+(\.[0-9]+)?$` (regex numérico puro). Como task_entries.total_amount
 *    é sempre ciphertext base64url para lançamentos criados após a
 *    criptografia, isso significa total_amount de projeto é efetivamente
 *    SEMPRE 0 para dados atuais — só somaria linhas legadas pré-criptografia.
 * 2. GetByID NÃO filtra por usuário nem por período — mostra o total geral
 *    de todos os usuários sempre, mesmo em workspace PERSONAL (diferente de
 *    List, que restringe ao usuário logado em workspace pessoal).
 * 3. Create/Update retornam total_tasks/total_sprints/total_hours/total_amount
 *    sempre como 0 — o Go nem busca esses valores nessas duas operações
 *    (só List/GetByID calculam de verdade).
 */
@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: ProjectFilters): Promise<ProjectResponse[]> {
    const periodFilter = this.buildPeriodFilter(filters.month);
    const userJoinClause =
      filters.workspaceType === 'PERSONAL' && filters.userId
        ? Prisma.sql`AND te.user_id = ${filters.userId}::uuid`
        : Prisma.sql``;

    const whereExtra: Prisma.Sql[] = [];
    if (filters.status) {
      whereExtra.push(
        Prisma.sql`AND p.status = ${filters.status}::project_status`,
      );
    }
    if (filters.search) {
      const term = `%${filters.search}%`;
      whereExtra.push(
        Prisma.sql`AND (p.name ILIKE ${term} OR p.code ILIKE ${term})`,
      );
    }

    const rows = await this.prisma.$queryRaw<ProjectRawRow[]>(Prisma.sql`
      SELECT
        p.id, p.workspace_id, p.workspace_type, p.name,
        p.description, p.code, p.status::text AS status, p.color, p.icon, p.created_by,
        TO_CHAR(p.start_date, 'YYYY-MM-DD') AS start_date,
        TO_CHAR(p.end_date, 'YYYY-MM-DD') AS end_date,
        p.archived_at, p.created_at, p.updated_at,
        COUNT(DISTINCT t.id)::int AS total_tasks,
        COUNT(DISTINCT s.id)::int AS total_sprints,
        COALESCE((SUM(te.time_spent_minutes) FILTER (WHERE ${periodFilter})) / 60.0, 0)::float8 AS total_hours,
        COALESCE(SUM(CASE
          WHEN (${periodFilter}) AND te.total_amount ~ '^[0-9]+(\\.[0-9]+)?$'
          THEN te.total_amount::numeric ELSE 0 END), 0)::float8 AS total_amount
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      LEFT JOIN sprints s ON s.project_id = p.id
      LEFT JOIN task_entries te ON (
        te.project_id = p.id
        OR (te.project_id IS NULL AND LOWER(COALESCE(te.project, '')) = LOWER(p.name))
      ) ${userJoinClause}
      WHERE p.workspace_id = ${filters.workspaceId}::uuid
      ${whereExtra.length ? Prisma.join(whereExtra, ' ', ' ') : Prisma.empty}
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    return rows.map((row) => this.toResponse(row));
  }

  async getById(
    id: string,
    workspaceId: string,
  ): Promise<ProjectResponse | null> {
    const rows = await this.prisma.$queryRaw<ProjectRawRow[]>(Prisma.sql`
      SELECT
        p.id, p.workspace_id, p.workspace_type, p.name,
        p.description, p.code, p.status::text AS status, p.color, p.icon, p.created_by,
        TO_CHAR(p.start_date, 'YYYY-MM-DD') AS start_date,
        TO_CHAR(p.end_date, 'YYYY-MM-DD') AS end_date,
        p.archived_at, p.created_at, p.updated_at,
        COUNT(DISTINCT t.id)::int AS total_tasks,
        COUNT(DISTINCT s.id)::int AS total_sprints,
        COALESCE((SUM(te.time_spent_minutes)) / 60.0, 0)::float8 AS total_hours,
        COALESCE(SUM(CASE
          WHEN te.total_amount ~ '^[0-9]+(\\.[0-9]+)?$'
          THEN te.total_amount::numeric ELSE 0 END), 0)::float8 AS total_amount
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      LEFT JOIN sprints s ON s.project_id = p.id
      LEFT JOIN task_entries te ON (
        te.project_id = p.id
        OR (te.project_id IS NULL AND LOWER(COALESCE(te.project, '')) = LOWER(p.name))
      )
      WHERE p.id = ${id}::uuid AND p.workspace_id = ${workspaceId}::uuid
      GROUP BY p.id
    `);

    return rows[0] ? this.toResponse(rows[0]) : null;
  }

  async create(input: CreateProjectInput): Promise<ProjectResponse> {
    const status = (input.status || project_status.ACTIVE) as project_status;

    const row = await this.prisma.projects.create({
      data: {
        workspace_id: input.workspaceId,
        workspace_type: input.workspaceType,
        name: input.name,
        description: input.description ?? null,
        code: input.code ?? null,
        status,
        color: input.color ?? null,
        icon: input.icon ?? null,
        created_by: input.createdBy,
        start_date: input.startDate ? new Date(input.startDate) : null,
        end_date: input.endDate ? new Date(input.endDate) : null,
      },
    });
    return this.toResponseZeroStats(row);
  }

  // Réplica exata da semântica COALESCE($n, coluna) do Go: undefined não
  // altera a coluna. archived_at segue a mesma regra condicional do SQL
  // original (seta NOW() ao entrar em ARCHIVED pela primeira vez, limpa ao
  // sair de ARCHIVED para outro status, mantém em qualquer outro caso).
  async update(
    id: string,
    workspaceId: string,
    input: UpdateProjectInput,
  ): Promise<ProjectResponse | null> {
    const current = await this.prisma.projects.findFirst({
      where: { id, workspace_id: workspaceId },
    });
    if (!current) return null;

    let archivedAt = current.archived_at;
    if (input.status !== undefined) {
      if (input.status === project_status.ARCHIVED && !archivedAt) {
        archivedAt = new Date();
      } else if (input.status !== project_status.ARCHIVED) {
        archivedAt = null;
      }
    }

    const row = await this.prisma.projects.update({
      where: { id },
      data: {
        name: input.name ?? current.name,
        description: input.description ?? current.description,
        code: input.code ?? current.code,
        status: (input.status as project_status | undefined) ?? current.status,
        color: input.color ?? current.color,
        icon: input.icon ?? current.icon,
        start_date: input.startDate
          ? new Date(input.startDate)
          : current.start_date,
        end_date: input.endDate ? new Date(input.endDate) : current.end_date,
        archived_at: archivedAt,
        updated_at: new Date(),
      },
    });
    return this.toResponseZeroStats(row);
  }

  async delete(id: string, workspaceId: string): Promise<void> {
    await this.prisma.projects.deleteMany({
      where: { id, workspace_id: workspaceId },
    });
  }

  async recalculateHours(
    id: string,
    workspaceId: string,
  ): Promise<ProjectResponse | null> {
    await this.prisma.$executeRaw(Prisma.sql`
      UPDATE task_entries te
      SET project_id = p.id
      FROM projects p
      WHERE p.id = ${id}::uuid
        AND p.workspace_id = ${workspaceId}::uuid
        AND te.project_id IS NULL
        AND te.project IS NOT NULL
        AND TRIM(te.project) <> ''
        AND LOWER(TRIM(te.project)) = LOWER(p.name)
        AND COALESCE(te.company_id, te.user_id)::uuid = p.workspace_id
    `);
    return this.getById(id, workspaceId);
  }

  private buildPeriodFilter(month: string | undefined): Prisma.Sql {
    if (!month) return Prisma.sql`TRUE`;
    const match = /^(\d+)-(\d+)/.exec(month);
    const year = match ? Number.parseInt(match[1], 10) : 0;
    const monthNum = match ? Number.parseInt(match[2], 10) : 0;
    return Prisma.sql`EXTRACT(YEAR FROM te.date) = ${year} AND EXTRACT(MONTH FROM te.date) = ${monthNum}`;
  }

  private toResponse(row: ProjectRawRow): ProjectResponse {
    return {
      id: row.id,
      workspace_id: row.workspace_id,
      workspace_type: row.workspace_type,
      name: row.name,
      description: omitEmpty(row.description),
      code: omitEmpty(row.code),
      status: row.status,
      color: omitEmpty(row.color),
      icon: omitEmpty(row.icon),
      created_by: row.created_by,
      start_date: omitEmpty(row.start_date),
      end_date: omitEmpty(row.end_date),
      archived_at: omitEmpty(row.archived_at),
      created_at: row.created_at,
      updated_at: row.updated_at,
      total_tasks: row.total_tasks,
      total_sprints: row.total_sprints,
      total_hours: row.total_hours,
      total_amount: row.total_amount,
    };
  }

  private toResponseZeroStats(row: {
    id: string;
    workspace_id: string;
    workspace_type: string;
    name: string;
    description: string | null;
    code: string | null;
    status: string;
    color: string | null;
    icon: string | null;
    created_by: string;
    start_date: Date | null;
    end_date: Date | null;
    archived_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }): ProjectResponse {
    return {
      id: row.id,
      workspace_id: row.workspace_id,
      workspace_type: row.workspace_type,
      name: row.name,
      description: omitEmpty(row.description),
      code: omitEmpty(row.code),
      status: row.status,
      color: omitEmpty(row.color),
      icon: omitEmpty(row.icon),
      created_by: row.created_by,
      start_date: row.start_date ? formatDateOnly(row.start_date) : undefined,
      end_date: row.end_date ? formatDateOnly(row.end_date) : undefined,
      archived_at: omitEmpty(row.archived_at),
      created_at: row.created_at,
      updated_at: row.updated_at,
      total_tasks: 0,
      total_sprints: 0,
      total_hours: 0,
      total_amount: 0,
    };
  }
}
