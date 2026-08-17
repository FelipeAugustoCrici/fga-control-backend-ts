import { Module } from '@nestjs/common';

import { CompaniesRepository } from './companies.repository';
import { CreateCompanyController } from './create-company/create-company.controller';
import { InviteMemberController } from './invite-member/invite-member.controller';
import { InviteMemberService } from './invite-member/invite-member.service';
import { ListMembersController } from './list-members/list-members.controller';
import { ListMyCompaniesController } from './list-my-companies/list-my-companies.controller';

@Module({
  controllers: [
    CreateCompanyController,
    ListMyCompaniesController,
    ListMembersController,
    InviteMemberController,
  ],
  providers: [CompaniesRepository, InviteMemberService],
  // CompaniesRepository é usado por modules/auth (register com empresa,
  // create-user) — réplica da dependência cruzada que já existe no Go.
  exports: [CompaniesRepository],
})
export class CompaniesModule {}
