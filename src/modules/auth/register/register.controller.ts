import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { dataResponse } from '../../../common/http/response.util';
import { RegisterDto } from './register.dto';
import { RegisterService } from './register.service';

@Controller('api/v1/auth')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const result = await this.registerService.execute(dto);
    return dataResponse(result);
  }
}
