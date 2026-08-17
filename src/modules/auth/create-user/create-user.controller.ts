import {
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
import { dataResponse } from '../../../common/http/response.util';
import { CreateUserDto } from './create-user.dto';
import { CreateUserService } from './create-user.service';

@Controller('api/v1/auth')
export class CreateUserController {
  constructor(private readonly createUserService: CreateUserService) {}

  @Post('create-user')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async createUser(
    @CurrentUser() auth: AuthContext,
    @Body() dto: CreateUserDto,
  ) {
    const result = await this.createUserService.execute(
      auth.userId,
      dto.name,
      dto.email,
      dto.role,
    );
    return dataResponse(result);
  }
}
