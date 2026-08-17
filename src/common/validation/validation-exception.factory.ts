import { BadRequestException, ValidationError } from '@nestjs/common';

/**
 * Usado como `exceptionFactory` do ValidationPipe global: extrai a primeira
 * mensagem de validação e monta um BadRequestException de mensagem única,
 * mais próximo de {"error": err.Error()} do Go do que o array padrão do
 * class-validator.
 */
export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  return new BadRequestException(firstMessage(errors) ?? 'dados inválidos');
}

function firstMessage(errors: ValidationError[]): string | undefined {
  for (const error of errors) {
    if (error.constraints) {
      const message = Object.values(error.constraints)[0];
      if (message) return message;
    }
    if (error.children?.length) {
      const nested = firstMessage(error.children);
      if (nested) return nested;
    }
  }
  return undefined;
}
