import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { AdminGuard } from '../../../common/auth/admin.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { messageResponse } from '../../../common/http/response.util';
import { AdminRepository } from '../admin.repository';
import { ReviewPlanRequestDto } from './review-plan-request.dto';

@Controller('api/v1/admin')
export class ReviewPlanRequestController {
  constructor(private readonly adminRepo: AdminRepository) {}

  @Post('plan-requests/:id/review')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, AdminGuard)
  async review(
    @CurrentUser() auth: AuthContext,
    @Param('id') id: string,
    @Body() dto: ReviewPlanRequestDto,
  ) {
    await this.adminRepo.reviewPlanRequest(
      id,
      auth.userId,
      dto.status,
      dto.note ?? null,
    );

    const message =
      dto.status === 'rejected'
        ? 'Solicitação rejeitada'
        : 'Solicitação aprovada com sucesso';
    return messageResponse(message);
  }
}
