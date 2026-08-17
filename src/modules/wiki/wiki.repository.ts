import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { omitEmpty } from '../../common/serialization/nullable';
import { Prisma } from '../../generated/prisma/client';
import { wiki_status, wiki_type } from '../../generated/prisma/enums';
import {
  CreateWikiInput,
  UpdateWikiInput,
  WikiFilters,
  WikiResponse,
} from './wiki.types';

const INCLUDE = {
  users: { select: { name: true } },
  sprints: { select: { name: true } },
} satisfies Prisma.wikisInclude;

type WikiRow = Prisma.wikisGetPayload<{ include: typeof INCLUDE }>;

// Réplica de internal/repository/wiki_repository.go.
@Injectable()
export class WikiRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    filters: WikiFilters,
  ): Promise<{ wikis: WikiResponse[]; total: number }> {
    const where = this.buildWhere(filters);
    const total = await this.prisma.wikis.count({ where });

    const perPage =
      filters.perPage && filters.perPage > 0 ? filters.perPage : 20;
    const page = filters.page && filters.page > 0 ? filters.page : 1;

    const rows = await this.prisma.wikis.findMany({
      where,
      include: INCLUDE,
      orderBy: { updated_at: 'desc' },
      take: perPage,
      skip: (page - 1) * perPage,
    });

    return { wikis: rows.map((row) => this.toResponse(row)), total };
  }

  async getById(id: string, workspaceId: string): Promise<WikiResponse | null> {
    const row = await this.prisma.wikis.findFirst({
      where: { id, workspace_id: workspaceId },
      include: INCLUDE,
    });
    return row ? this.toResponse(row) : null;
  }

  async create(input: CreateWikiInput): Promise<WikiResponse> {
    const status = (input.status || wiki_status.DRAFT) as wiki_status;

    const row = await this.prisma.wikis.create({
      data: {
        workspace_id: input.workspaceId,
        sprint_id: input.sprintId ?? null,
        title: input.title,
        description: input.description ?? null,
        content: input.content ?? '',
        type: input.type as wiki_type,
        version: input.version ?? null,
        status,
        tags: input.tags ?? [],
        created_by: input.createdBy,
        published_at: status === wiki_status.PUBLISHED ? new Date() : null,
      },
      include: INCLUDE,
    });
    return this.toResponse(row);
  }

  // Réplica do SET dinâmico do Go: só os campos enviados entram no UPDATE.
  // sprintId presente (mesmo null) mexe no vínculo; ausente (undefined) não
  // mexe — mesma semântica do **string do Go.
  async update(
    id: string,
    workspaceId: string,
    input: UpdateWikiInput,
  ): Promise<WikiResponse | null> {
    const data: Prisma.wikisUncheckedUpdateManyInput = {
      updated_at: new Date(),
    };

    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.content !== undefined) data.content = input.content;
    if (input.type !== undefined) data.type = input.type as wiki_type;
    if (input.version !== undefined) data.version = input.version;
    if (input.status !== undefined) {
      data.status = input.status as wiki_status;
      if (input.status === wiki_status.PUBLISHED) {
        // COALESCE(published_at, NOW()): só define se ainda não publicada.
        const current = await this.prisma.wikis.findUnique({
          where: { id },
          select: { published_at: true },
        });
        data.published_at = current?.published_at ?? new Date();
      }
    }
    if (input.tags !== undefined) data.tags = input.tags;
    if (input.sprintId !== undefined) data.sprint_id = input.sprintId;

    // updateMany (não update) porque o filtro precisa de id + workspace_id
    // juntos, para isolamento de tenant — update() só aceita where único.
    const result = await this.prisma.wikis.updateMany({
      where: { id, workspace_id: workspaceId },
      data,
    });
    if (result.count === 0) return null;

    return this.getById(id, workspaceId);
  }

  async delete(id: string, workspaceId: string): Promise<void> {
    await this.prisma.wikis.deleteMany({
      where: { id, workspace_id: workspaceId },
    });
  }

  private buildWhere(filters: WikiFilters): Prisma.wikisWhereInput {
    const where: Prisma.wikisWhereInput = { workspace_id: filters.workspaceId };
    if (filters.type) where.type = filters.type as wiki_type;
    if (filters.status) where.status = filters.status as wiki_status;
    if (filters.sprintId) where.sprint_id = filters.sprintId;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private toResponse(row: WikiRow): WikiResponse {
    return {
      id: row.id,
      workspace_id: row.workspace_id,
      sprint_id: omitEmpty(row.sprint_id),
      title: row.title,
      description: omitEmpty(row.description),
      content: row.content,
      type: row.type,
      version: omitEmpty(row.version),
      status: row.status,
      tags: row.tags,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      published_at: omitEmpty(row.published_at),
      created_by_name: omitEmpty(row.users?.name),
      sprint_name: omitEmpty(row.sprints?.name),
    };
  }
}
