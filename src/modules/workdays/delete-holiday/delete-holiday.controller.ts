import {
  Controller,
  Delete,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

import type { AuthContext } from '../../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { messageResponse } from '../../../common/http/response.util';
import { HolidaysRepository } from '../holidays.repository';

@Controller('api/v1/holidays')
export class DeleteHolidayController {
  constructor(private readonly holidaysRepo: HolidaysRepository) {}

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@CurrentUser() auth: AuthContext, @Param('id') id: string) {
    const deleted = await this.holidaysRepo.delete(id, auth.userId);
    if (!deleted) {
      throw new NotFoundException('feriado não encontrado');
    }
    return messageResponse('feriado removido');
  }
}
