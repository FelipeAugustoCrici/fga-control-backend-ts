import { Injectable } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

/**
 * Compatível byte a byte com internal/crypto/crypto.go: AES-256-GCM,
 * chave = SHA256(FIELD_ENCRYPT_KEY), payload = base64url sem padding de
 * (nonce[12] || ciphertext || tag[16]). Usado para os campos financeiros
 * (task_entries.hourly_rate/total_amount, user_settings.*) que continuam
 * podendo ser lidos/escritos pelo backend Go durante a transição.
 */
const ALGORITHM = 'aes-256-gcm';
const NONCE_LENGTH = 12;
const TAG_LENGTH = 16;

@Injectable()
export class FieldEncryptionService {
  private deriveKey(): Buffer {
    const raw = process.env.FIELD_ENCRYPT_KEY;
    if (!raw) {
      throw new Error('FIELD_ENCRYPT_KEY não definida');
    }
    return createHash('sha256').update(raw, 'utf8').digest();
  }

  encryptFloat(value: number): string {
    const key = this.deriveKey();
    const nonce = randomBytes(NONCE_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, nonce);
    const plaintext = Buffer.from(formatFloat(value), 'utf8');
    const ciphertext = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([nonce, ciphertext, tag]).toString('base64url');
  }

  decryptFloat(encoded: string): number {
    const data = decodeBase64UrlLoose(encoded);
    if (data && data.length >= NONCE_LENGTH + TAG_LENGTH) {
      const key = this.deriveKey();
      const nonce = data.subarray(0, NONCE_LENGTH);
      const tag = data.subarray(data.length - TAG_LENGTH);
      const ciphertext = data.subarray(NONCE_LENGTH, data.length - TAG_LENGTH);
      const decipher = createDecipheriv(ALGORITHM, key, nonce);
      decipher.setAuthTag(tag);
      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
      return parseFloat(plaintext.toString('utf8'));
    }

    // Legado: valor numérico puro gravado antes da criptografia existir.
    const legacy = Number(encoded);
    if (encoded.trim() !== '' && !Number.isNaN(legacy)) {
      return legacy;
    }

    throw new Error('não foi possível decodificar valor criptografado');
  }
}

function formatFloat(value: number): string {
  // Equivalente prático a strconv.FormatFloat(value, 'f', -1, 64) para as
  // magnitudes financeiras reais deste sistema (taxas/valores monetários).
  return value.toString();
}

function decodeBase64UrlLoose(encoded: string): Buffer | null {
  try {
    // Buffer aceita base64url com ou sem padding, cobrindo tanto o formato
    // atual quanto o legado com padding mencionado em DecryptFloat64 no Go.
    return Buffer.from(encoded, 'base64url');
  } catch {
    return null;
  }
}
