import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { CategoryResponse } from './categories.types';

// Réplica de internal/repository/category_repository.go. Categorias são
// globais (sem user_id/company_id) — lista compartilhada por todo o sistema.
@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<CategoryResponse[]> {
    const rows = await this.prisma.categories.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, color: true, billable: true },
    });
    return rows;
  }

  async upsert(
    name: string,
    color: string,
    billable: boolean,
  ): Promise<CategoryResponse> {
    const row = await this.prisma.categories.upsert({
      where: { name },
      create: { name, color, billable },
      update: { color, billable },
      select: { id: true, name: true, color: true, billable: true },
    });
    return row;
  }

  async delete(id: string): Promise<void> {
    // deleteMany em vez de delete: o Go usa um Exec simples que não falha
    // se o id não existir (idempotente) — delete() do Prisma lançaria P2025.
    await this.prisma.categories.deleteMany({ where: { id } });
  }
}
