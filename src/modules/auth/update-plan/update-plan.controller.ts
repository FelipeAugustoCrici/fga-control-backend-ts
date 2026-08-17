import { Body, Controller, Put, UseGuards } from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { UpdatePlanDto } from './update-plan.dto';
import { UpdatePlanService } from './update-plan.service';

@Controller('api/v1/auth')
export class UpdatePlanController {
  constructor(private readonly updatePlanService: UpdatePlanService) {}

  @Put('plan')
  @UseGuards(JwtAuthGuard)
  async updatePlan(
    @CurrentUser() auth: AuthContext,
    @Body() dto: UpdatePlanDto,
  ) {
    const user = await this.updatePlanService.execute(auth.userId, dto.plan_id);
    return dataResponse(user);
  }
}
