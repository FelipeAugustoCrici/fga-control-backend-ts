import { Injectable, UnauthorizedException } from '@nestjs/common';

import { CompaniesRepository } from '../companies/companies.repository';
import { EntryFilters } from './entries.types';

/**
 * Réplica de EntryHandler.resolveFilter / ReportHandler.resolveFilter
 * (idênticas no Go — duplicadas lá, unificadas aqui). Se x-company-id
 * presente e o usuário não for membro, o Go devolve o MESMO erro genérico
 * de "não autenticado" (401) que usa para claims ausentes — não um 403 de
 * permissão — replicado exatamente, por mais estranho que pareça.
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

    const { isMember } = await this.companiesRepo.isMember(companyId, userId);
    if (!isMember) {
      throw new UnauthorizedException('usuário não autenticado');
    }

    return { companyId, userId };
  }
}
