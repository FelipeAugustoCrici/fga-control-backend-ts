import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Normaliza todo erro para o formato do Go: {"error": "<mensagem>"},
 * com campos extras opcionais (ver AppException). Nunca vaza detalhe
 * interno em 500 — desvio deliberado do Go, que às vezes vaza err.Error().
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(normalizeBody(body, exception.message));
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'erro interno do servidor' });
  }
}

function normalizeBody(
  body: unknown,
  fallbackMessage: string,
): Record<string, unknown> {
  if (typeof body === 'string') {
    return { error: body };
  }

  if (isRecord(body)) {
    // Corpo já montado por AppException: { error, ...extra }, sem os campos
    // padrão do Nest (statusCode/message) — repassa como está.
    if ('error' in body && !('statusCode' in body)) {
      return body;
    }

    // Formato padrão do Nest (HttpException nativa ou ValidationPipe):
    // { statusCode, message: string | string[], error: '<nome do status>' }.
    // O campo "error" aqui é só o nome do status HTTP, não a mensagem —
    // por isso é descartado em favor de "message".
    const extra: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (key === 'statusCode' || key === 'message' || key === 'error')
        continue;
      extra[key] = value;
    }
    return { error: extractMessage(body.message, fallbackMessage), ...extra };
  }

  return { error: fallbackMessage };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractMessage(message: unknown, fallback: string): string {
  if (Array.isArray(message) && typeof message[0] === 'string') {
    return message[0];
  }
  if (typeof message === 'string') {
    return message;
  }
  return fallback;
}
