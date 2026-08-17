import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Para erros que precisam de campos extras além de {"error": "..."},
 * replicando casos do Go como limite de plano excedido
 * ({error, limit_reached, current, remaining, message}) ou permissão
 * negada ({error, module, action}). Para o caso comum (só uma mensagem),
 * prefira as exceções nativas do Nest (NotFoundException, ForbiddenException
 * etc.) — o HttpExceptionFilter global já as normaliza para {"error": "..."}.
 */
export class AppException extends HttpException {
  constructor(
    status: HttpStatus,
    message: string,
    extra?: Record<string, unknown>,
  ) {
    super({ error: message, ...extra }, status);
  }
}
