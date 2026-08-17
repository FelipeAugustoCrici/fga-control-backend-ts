import {
  Controller,
  Delete,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { messageResponse } from '../../../common/http/response.util';
import { EntriesRepository } from '../entries.repository';

@Controller('api/v1/entries')
export class DeleteEntryController {
  constructor(private readonly entriesRepo: EntriesRepository) {}

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    const deleted = await this.entriesRepo.delete(id);
    if (!deleted) {
      throw new NotFoundException('lançamento não encontrado');
    }
    return messageResponse('lançamento removido');
  }
}
