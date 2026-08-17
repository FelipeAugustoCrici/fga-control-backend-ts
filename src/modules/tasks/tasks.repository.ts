import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { omitEmpty } from '../../common/serialization/nullable';
import { Prisma } from '../../generated/prisma/client';
import { CompaniesRepository } from '../companies/companies.repository';
import {
  CreateTaskInput,
  TaskFilters,
  TaskResponse,
  UpdateTaskInput,
} from './tasks.types';

interface TaskRawRow {
  id: string;
  workspace_id: string;
  code: string | null;
  project_id: string | null;
  sprint_id: string | null;
  assigned_user_id: string | null;
  title: string;
  description: string | null;
  task_type: string | null;
  status: string;
  priority: string;
  estimated_hours: number;
  worked_hours: number;
  due_date: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  assigned_user_name: string | null;
  assigned_user_email: string | null;
  created_by_name: string | null;
  sprint_name: string | null;
}

// Réplica de internal/repository/task_repository.go's baseQuery. code é
// preenchido por trigger de banco (generate_task_code), nunca escrito pela
// aplicação. estimated_hours/worked_hours convertidos para float8 no SELECT
// para chegar como number puro (não Prisma.Decimal), igual ao float64 do Go.
const BASE_SELECT = Prisma.sql`
  SELECT
    t.id, t.workspace_id, t.code, t.project_id, t.sprint_id, t.assigned_user_id,
    t.title, t.description, t.task_type, t.status, t.priority,
    t.estimated_hours::float8 AS estimated_hours,
    t.worked_hours::float8 AS worked_hours,
    t.due_date,
    t.created_by, t.created_at, t.updated_at,
    au.name  AS assigned_user_name,
    au.email AS assigned_user_email,
    cu.name  AS created_by_name,
    s.name   AS sprint_name
  FROM tasks t
  LEFT JOIN users  au ON au.id = t.assigned_user_id
  LEFT JOIN users  cu ON cu.id = t.created_by
  LEFT JOIN sprints s ON s.id  = t.sprint_id
`;

// Mapa de campos ordenáveis permitidos — evita SQL injection via sort_field
// (réplica de validSortFields).
const SORT_EXPRESSIONS: Record<string, Prisma.Sql> = {
  code: Prisma.sql`t.code`,
  title: Prisma.sql`t.title`,
  due_date: Prisma.sql`t.due_date`,
  created_at: Prisma.sql`t.created_at`,
  updated_at: Prisma.sql`t.updated_at`,
  worked_hours: Prisma.sql`t.worked_hours`,
  remaining_hours: Prisma.sql`(t.estimated_hours - t.worked_hours)`,
  priority: Prisma.sql`CASE t.priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 WHEN 'LOW' THEN 4 ELSE 5 END`,
  status: Prisma.sql`CASE t.status WHEN 'TODO' THEN 1 WHEN 'IN_PROGRESS' THEN 2 WHEN 'REVIEW' THEN 3 WHEN 'DONE' THEN 4 ELSE 5 END`,
};

function buildOrderBy(
  sortField: string | undefined,
  sortDir: string | undefined,
): Prisma.Sql {
  const dir =
    sortDir?.toUpperCase() === 'DESC' ? Prisma.sql`DESC` : Prisma.sql`ASC`;
  const expr = sortField ? SORT_EXPRESSIONS[sortField] : undefined;
  if (!expr) return Prisma.sql`ORDER BY t.code DESC`;
  if (sortField === 'due_date') {
    return Prisma.sql`ORDER BY ${expr} ${dir} NULLS LAST, t.code ASC`;
  }
  return Prisma.sql`ORDER BY ${expr} ${dir}, t.code ASC`;
}

function buildWhere(f: TaskFilters): Prisma.Sql {
  const clauses: Prisma.Sql[] = [
    Prisma.sql`t.workspace_id = ${f.workspaceId}::uuid`,
  ];

  // funcionário comum: só vê as próprias tasks
  if (f.onlyMine && f.requesterId) {
    clauses.push(Prisma.sql`t.assigned_user_id = ${f.requesterId}::uuid`);
  }
  if (f.assignedUserId) {
    clauses.push(Prisma.sql`t.assigned_user_id = ${f.assignedUserId}::uuid`);
  }
  if (f.status) clauses.push(Prisma.sql`t.status = ${f.status}`);
  if (f.priority) clauses.push(Prisma.sql`t.priority = ${f.priority}`);
  if (f.taskType) clauses.push(Prisma.sql`t.task_type = ${f.taskType}`);
  if (f.sprintId) clauses.push(Prisma.sql`t.sprint_id = ${f.sprintId}::uuid`);
  if (f.projectId)
    clauses.push(Prisma.sql`t.project_id = ${f.projectId}::uuid`);
  if (f.search) {
    const like = `%${f.search.trim()}%`;
    clauses.push(Prisma.sql`(t.title ILIKE ${like} OR t.code ILIKE ${like})`);
  }
  // tasks atrasadas: due_date passado e não concluídas
  if (f.overdue) {
    clauses.push(
      Prisma.sql`t.due_date IS NOT NULL AND t.due_date < NOW() AND t.status != 'DONE'`,
    );
  }
  // tasks com horas excedidas
  if (f.exceeded) {
    clauses.push(
      Prisma.sql`t.estimated_hours > 0 AND t.worked_hours > t.estimated_hours`,
    );
  }
  // tasks sem lançamentos vinculados
  if (f.noEntries) {
    clauses.push(
      Prisma.sql`NOT EXISTS (SELECT 1 FROM task_entries te WHERE te.task_id = t.id)`,
    );
  }

  return Prisma.sql`WHERE ${Prisma.join(clauses, ' AND ')}`;
}

// dueDate aceita "YYYY-MM-DD" ou RFC3339 completo, igual ao Go. Erro de
// parse aqui vira um Error genérico não tratado — o handler Go original
// devolve 500 "erro ao criar/atualizar tarefa" (não é um dos erros
// nomeados tratados no switch), e a política do backend TS generaliza todo
// 500 não mapeado para "erro interno do servidor" (desvio deliberado já
// documentado no plano — não vaza detalhe do Go nem do TS).
function parseFlexibleDate(value: string): Date {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsed = isDateOnly
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('dueDate inválido');
  }
  return parsed;
}

@Injectable()
export class TasksRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companiesRepo: CompaniesRepository,
  ) {}

  // Réplica da validação duplicada em Create/Update/UpdateAssign no Go:
  // membro via company_members, com fallback em users.company_id para
  // contas antigas.
  async validateAssignee(
    workspaceId: string,
    assignedUserId: string,
  ): Promise<void> {
    const { isMember } = await this.companiesRepo.isMember(
      workspaceId,
      assignedUserId,
    );
    if (isMember) return;
    const fallback = await this.companiesRepo.isUserInWorkspace(
      workspaceId,
      assignedUserId,
    );
    if (!fallback) {
      throw new BadRequestException('usuário atribuído não pertence à empresa');
    }
  }

  async list(
    filters: TaskFilters,
  ): Promise<{ tasks: TaskResponse[]; total: number }> {
    const where = buildWhere(filters);

    const countRows = await this.prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`SELECT COUNT(*) AS count FROM tasks t ${where}`,
    );
    const total = Number(countRows[0]?.count ?? 0n);

    const perPage = filters.perPage > 0 ? filters.perPage : 20;
    const page = filters.page > 0 ? filters.page : 1;
    const offset = (page - 1) * perPage;
    const orderBy = buildOrderBy(filters.sortField, filters.sortDir);

    const rows = await this.prisma.$queryRaw<TaskRawRow[]>(
      Prisma.sql`${BASE_SELECT} ${where} ${orderBy} LIMIT ${perPage} OFFSET ${offset}`,
    );

    return { tasks: rows.map((row) => this.toResponse(row)), total };
  }

  async getById(id: string, workspaceId: string): Promise<TaskResponse | null> {
    const rows = await this.prisma.$queryRaw<TaskRawRow[]>(
      Prisma.sql`${BASE_SELECT} WHERE t.id = ${id}::uuid AND t.workspace_id = ${workspaceId}::uuid`,
    );
    return rows[0] ? this.toResponse(rows[0]) : null;
  }

  async create(input: CreateTaskInput): Promise<TaskResponse> {
    const dueDate = input.dueDate ? parseFlexibleDate(input.dueDate) : null;

    const created = await this.prisma.tasks.create({
      data: {
        workspace_id: input.workspaceId,
        assigned_user_id: input.assignedUserId ?? null,
        sprint_id: input.sprintId ?? null,
        project_id: input.projectId ?? null,
        title: input.title,
        description: input.description ?? null,
        task_type: input.taskType || 'FEATURE',
        priority: input.priority,
        estimated_hours: input.estimatedHours,
        due_date: dueDate,
        created_by: input.createdBy,
      },
    });

    return (await this.getById(created.id, input.workspaceId))!;
  }

  // Padrão "get-modify-put back" do Go: relê a task atual e reaplica só os
  // campos enviados por cima antes de regravar todas as colunas editáveis
  // de uma vez. assignedUserId NÃO trata "" como "desvincular" (diferente
  // de sprintId/projectId/dueDate) — uma string vazia é escrita como está
  // e quebra a constraint de UUID no banco, replicando um bug real do Go
  // (vira 500 genérico, não 400).
  async update(
    id: string,
    workspaceId: string,
    input: UpdateTaskInput,
  ): Promise<TaskResponse | null> {
    const current = await this.getById(id, workspaceId);
    if (!current) return null;

    const dueDate =
      input.dueDate !== undefined
        ? input.dueDate === ''
          ? null
          : parseFlexibleDate(input.dueDate)
        : current.due_date;

    await this.prisma.tasks.updateMany({
      where: { id, workspace_id: workspaceId },
      data: {
        title: input.title ?? current.title,
        description: input.description ?? current.description ?? null,
        assigned_user_id:
          input.assignedUserId !== undefined
            ? input.assignedUserId
            : current.assigned_user_id,
        priority: input.priority ?? current.priority,
        estimated_hours: input.estimatedHours ?? current.estimated_hours,
        due_date: dueDate ?? null,
        task_type: input.taskType ?? current.task_type,
        sprint_id:
          input.sprintId !== undefined
            ? input.sprintId === ''
              ? null
              : input.sprintId
            : current.sprint_id,
        project_id:
          input.projectId !== undefined
            ? input.projectId === ''
              ? null
              : input.projectId
            : current.project_id,
        updated_at: new Date(),
      },
    });

    return this.getById(id, workspaceId);
  }

  async updateStatus(
    id: string,
    workspaceId: string,
    status: string,
  ): Promise<TaskResponse | null> {
    await this.prisma.tasks.updateMany({
      where: { id, workspace_id: workspaceId },
      data: { status, updated_at: new Date() },
    });
    return this.getById(id, workspaceId);
  }

  async updateAssign(
    id: string,
    workspaceId: string,
    assignedUserId: string | null,
  ): Promise<TaskResponse | null> {
    await this.prisma.tasks.updateMany({
      where: { id, workspace_id: workspaceId },
      data: { assigned_user_id: assignedUserId, updated_at: new Date() },
    });
    return this.getById(id, workspaceId);
  }

  async updateSprint(
    id: string,
    workspaceId: string,
    sprintId: string | null,
  ): Promise<TaskResponse | null> {
    await this.prisma.tasks.updateMany({
      where: { id, workspace_id: workspaceId },
      data: { sprint_id: sprintId, updated_at: new Date() },
    });
    return this.getById(id, workspaceId);
  }

  private toResponse(row: TaskRawRow): TaskResponse {
    return {
      id: row.id,
      workspace_id: row.workspace_id,
      code: row.code ?? '',
      project_id: omitEmpty(row.project_id),
      sprint_id: omitEmpty(row.sprint_id),
      assigned_user_id: omitEmpty(row.assigned_user_id),
      title: row.title,
      description: omitEmpty(row.description),
      task_type: row.task_type || 'FEATURE',
      status: row.status,
      priority: row.priority,
      estimated_hours: row.estimated_hours,
      worked_hours: row.worked_hours,
      due_date: omitEmpty(row.due_date),
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      assigned_user_name: omitEmpty(row.assigned_user_name),
      assigned_user_email: omitEmpty(row.assigned_user_email),
      created_by_name: omitEmpty(row.created_by_name),
      sprint_name: omitEmpty(row.sprint_name),
    };
  }
}
