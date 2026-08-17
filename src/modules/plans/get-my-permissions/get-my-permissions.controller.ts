import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { GetMyPermissionsService } from './get-my-permissions.service';

@Controller('api/v1/auth/me/permissions')
export class GetMyPermissionsController {
  constructor(
    private readonly getMyPermissionsService: GetMyPermissionsService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyPermissions(
    @CurrentUser() auth: AuthContext,
    @Req() req: Request,
  ) {
    const companyId = req.headers['x-company-id'];
    const perms = await this.getMyPermissionsService.execute(
      auth.userId,
      typeof companyId === 'string' && companyId !== '' ? companyId : undefined,
    );
    return dataResponse(perms);
  }
}
