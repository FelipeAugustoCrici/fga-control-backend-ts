import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// bcrypt.DefaultCost em golang.org/x/crypto/bcrypt é 10 — usado em todo
// internal/service/auth_service.go. Hashes existentes no banco continuam
// verificáveis independente disso, pois o custo fica embutido no hash.
const SALT_ROUNDS = 10;

@Injectable()
export class PasswordService {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
