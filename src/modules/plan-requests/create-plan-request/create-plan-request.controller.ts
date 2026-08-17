import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { messageResponse } from '../../../common/http/response.util';
import { CreatePlanRequestDto } from './create-plan-request.dto';
import { CreatePlanRequestService } from './create-plan-request.service';

@Controller('api/v1/plan-requests')
export class CreatePlanRequestController {
  constructor(
    private readonly createPlanRequestService: CreatePlanRequestService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() auth: AuthContext,
    @Body() dto: CreatePlanRequestDto,
  ) {
    if (!dto.requested_plan_id) {
      throw new BadRequestException('requested_plan_id é obrigatório');
    }

    const request = await this.createPlanRequestService.execute(
      auth.userId,
      dto.requested_plan_id,
    );
    return messageResponse(
      'Solicitação enviada com sucesso. O administrador será notificado.',
      {
        data: request,
      },
    );
  }
}
