import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { dataResponse } from '../../../common/http/response.util';
import { EntriesRepository } from '../entries.repository';
import { UpdateEntryDto } from './update-entry.dto';

@Controller('api/v1/entries')
export class UpdateEntryController {
  constructor(private readonly entriesRepo: EntriesRepository) {}

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateEntryDto) {
    const entry = await this.entriesRepo.update(id, {
      taskId: dto.task_id,
      date: dto.date,
      taskCode: dto.task_code,
      description: dto.description,
      timeSpentMinutes: dto.time_spent_minutes,
      hourlyRate: dto.hourly_rate,
      status: dto.status,
      category: dto.category,
      project: dto.project,
      notes: dto.notes,
      startTime: dto.start_time,
      endTime: dto.end_time,
    });
    if (!entry) {
      throw new NotFoundException('lançamento não encontrado');
    }
    return dataResponse(entry);
  }
}
