import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { messageResponse } from '../../../common/http/response.util';
import { InviteMemberDto } from './invite-member.dto';
import { InviteMemberService } from './invite-member.service';

@Controller('api/v1/companies/invite')
export class InviteMemberController {
  constructor(private readonly inviteMemberService: InviteMemberService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async invite(
    @CurrentUser() auth: AuthContext,
    @Body() dto: InviteMemberDto,
    @Headers('x-company-id') companyId?: string,
  ) {
    if (!companyId) {
      throw new BadRequestException('x-company-id obrigatório');
    }

    await this.inviteMemberService.execute(companyId, auth.userId, dto);
    return messageResponse('membro adicionado com sucesso');
  }
}
