import {
  Controller,
  Delete,
  ForbiddenException,
  Headers,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { messageResponse } from '../../../common/http/response.util';
import { WorkspaceResolverService } from '../../../common/tenancy/workspace-resolver.service';
import { company_role } from '../../../generated/prisma/enums';
import { EntriesRepository } from '../entries.repository';

// Até aqui não existia NENHUMA checagem — qualquer usuário logado
// conseguia excluir o lançamento de qualquer outra pessoa só sabendo o id.
// Regra: exclusão de lançamento é sempre ADMIN-only (mesmo o próprio —
// réplica do que applyRoleRestrictions já definia pra ENTRIES: EMPLOYEE e
// MANAGER têm delete:false, só ADMIN exclui), mesmo padrão já usado em
// Wiki/Projetos/Sprints. Conta pessoal (sem empresa) continua podendo
// excluir os próprios — o resolver trata PERSONAL como ADMIN do próprio
// workspace.
@Controller('api/v1/entries')
export class DeleteEntryController {
  constructor(
    private readonly entriesRepo: EntriesRepository,
    private readonly workspaceResolver: WorkspaceResolverService,
  ) {}

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(
    @CurrentUser() auth: AuthContext,
    @Param('id') id: string,
    @Headers('x-company-id') companyId?: string,
  ) {
    const ownership = await this.entriesRepo.getOwnership(id);
    if (!ownership) {
      throw new NotFoundException('lançamento não encontrado');
    }

    const workspace = await this.workspaceResolver.resolve(
      auth.userId,
      companyId,
    );

    if (workspace.workspaceType === 'PERSONAL') {
      // Resolver sempre devolve ADMIN pra PERSONAL — precisa garantir que
      // não é o lançamento da conta pessoal de outra pessoa.
      if (ownership.userId !== auth.userId) {
        throw new ForbiddenException(
          'sem permissão para excluir este lançamento',
        );
      }
    } else {
      if (workspace.role !== company_role.ADMIN) {
        throw new ForbiddenException(
          'apenas administradores podem excluir lançamentos',
        );
      }
      if (ownership.companyId !== companyId) {
        throw new ForbiddenException(
          'lançamento não pertence a esta empresa',
        );
      }
    }

    const deleted = await this.entriesRepo.delete(id);
    if (!deleted) {
      throw new NotFoundException('lançamento não encontrado');
    }
    return messageResponse('lançamento removido');
  }
}
