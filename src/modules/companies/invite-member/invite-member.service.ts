import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { company_role } from '../../../generated/prisma/enums';
import { CompaniesRepository } from '../companies.repository';
import { InviteMemberDto } from './invite-member.dto';

// Réplica de CompanyHandler.Invite: só ADMIN ou MANAGER da empresa podem
// convidar.
@Injectable()
export class InviteMemberService {
  constructor(private readonly companiesRepo: CompaniesRepository) {}

  async execute(
    companyId: string,
    callerId: string,
    dto: InviteMemberDto,
  ): Promise<void> {
    const { isMember, role } = await this.companiesRepo.isMember(
      companyId,
      callerId,
    );
    if (
      !isMember ||
      (role !== company_role.ADMIN && role !== company_role.MANAGER)
    ) {
      throw new ForbiddenException('sem permissão para convidar');
    }

    const targetUserId = await this.companiesRepo.getUserIdByEmail(dto.email);
    if (!targetUserId) {
      throw new NotFoundException('usuário não encontrado com este e-mail');
    }

    await this.companiesRepo.addMember(companyId, targetUserId, dto.role);
  }
}
