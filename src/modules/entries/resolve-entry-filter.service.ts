import { Injectable, UnauthorizedException } from '@nestjs/common';

import { company_role } from '../../generated/prisma/enums';
import { CompaniesRepository } from '../companies/companies.repository';
import { EntryFilters } from './entries.types';

/**
 * Réplica de EntryHandler.resolveFilter / ReportHandler.resolveFilter
 * (idênticas no Go — duplicadas lá, unificadas aqui). Se x-company-id
 * presente e o usuário não for membro, o Go devolve o MESMO erro genérico
 * de "não autenticado" (401) que usa para claims ausentes — não um 403 de
 * permissão — replicado exatamente, por mais estranho que pareça.
 *
 * Escopo por role adicionado aqui (não existia nem no Go nem antes): esse
 * service é o ponto único usado por Dashboard, Relatórios, Insights
 * CLT/PJ, a drawer de Insights financeiros e Exportação — todos herdam a
 * mesma regra. Antes, QUALQUER role com x-company-id via a empresa
 * inteira (buildWhere filtra só por company_id, ignorando quem pediu).
 * Agora: ADMIN continua vendo a empresa inteira; MANAGER só se mesmo +
 * quem reporta direto pra ele (hierarquia); EMPLOYEE só os próprios dados,
 * mesmo em contexto de empresa.
 */
@Injectable()
export class ResolveEntryFilterService {
  constructor(private readonly companiesRepo: CompaniesRepository) {}

  async resolve(
    userId: string,
    companyId: string | undefined,
  ): Promise<EntryFilters> {
    if (!companyId) {
      return { userId };
    }

    const caller = await this.companiesRepo.isMember(companyId, userId);
    if (!caller.isMember) {
      throw new UnauthorizedException('usuário não autenticado');
    }

    if (caller.role === company_role.ADMIN) {
      return { companyId, userId };
    }

    if (caller.role === company_role.MANAGER) {
      const reportIds = await this.companiesRepo.listDirectReportIds(
        companyId,
        userId,
      );
      return { companyId, userId, userIds: [userId, ...reportIds] };
    }

    // EMPLOYEE: só os próprios lançamentos, independente de ter empresa.
    return { userId };
  }
}
