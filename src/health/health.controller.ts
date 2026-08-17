import { Controller, Get } from '@nestjs/common';

// Réplica de main.go: r.GET("/health", ...) -> {"status": "ok"}, fora do
// grupo /api/v1 (usado pelo healthcheck do Railway).
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
