import { Controller, Get } from '@nestjs/common';

import { dataResponse } from '../../../common/http/response.util';
import { ListPlansService } from './list-plans.service';

// GET /api/v1/plans — pública, sem guard (réplica de main.go:
// api.GET("/plans", permissionHandler.ListPlans)).
@Controller('api/v1/plans')
export class ListPlansController {
  constructor(private readonly listPlansService: ListPlansService) {}

  @Get()
  async list() {
    const plans = await this.listPlansService.execute();
    return dataResponse(plans);
  }
}
