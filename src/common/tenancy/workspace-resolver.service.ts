import { ForbiddenException, Injectable } from '@nestjs/common';

import { CompaniesRepository } from '../../modules/companies/companies.repository';
import { company_role } from '../../generated/prisma/enums';

export interface WorkspaceContext {
  workspaceId: string;
  workspaceType: 'PERSONAL' | 'COMPANY';
  role: company_role;
}

/**
 * Réplica de resolveWorkspace — duplicada verbatim em
 * wiki_handler.go/project_handler.go/sprint_handler.go/task_handler.go no
 * Go (confirmado idêntico nos 4), unificada aqui.
 *
 * Nota: o branch final do Go (`if wsType == "PERSONAL" || companyID == ""`)
 * é sempre verdadeiro quando alcançado, porque nesse ponto companyID já é
 * garantidamente "" — o fallback "workspace não identificado" é código
 * morto inalcançável. Simplificado aqui para refletir o comportamento real
 * (sempre PERSONAL quando não há x-company-id).
 */
@Injectable()
export class WorkspaceResolverService {
  constructor(private readonly companiesRepo: CompaniesRepository) {}

  async resolve(
    userId: string,
    companyId: string | undefined,
  ): Promise<WorkspaceContext> {
    if (companyId) {
      const { isMember, role } = await this.companiesRepo.isMember(
        companyId,
        userId,
      );
      if (!isMember || !role) {
        throw new ForbiddenException('você não é membro desta empresa');
      }
      return { workspaceId: companyId, workspaceType: 'COMPANY', role };
    }

    return {
      workspaceId: userId,
      workspaceType: 'PERSONAL',
      role: company_role.ADMIN,
    };
  }
}
