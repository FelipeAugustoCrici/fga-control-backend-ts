import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { EntriesRepository } from '../entries.repository';

@Controller('api/v1/entries')
export class GetEntryController {
  constructor(private readonly entriesRepo: EntriesRepository) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async get(@Param('id') id: string) {
    const entry = await this.entriesRepo.getById(id);
    if (!entry) {
      throw new NotFoundException('lançamento não encontrado');
    }
    return dataResponse(entry);
  }
}
