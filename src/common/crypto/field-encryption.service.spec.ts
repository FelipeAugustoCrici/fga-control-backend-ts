import { FieldEncryptionService } from './field-encryption.service';

describe('FieldEncryptionService', () => {
  const KEY = 'test-key-for-cross-language-check-32';

  beforeEach(() => {
    process.env.FIELD_ENCRYPT_KEY = KEY;
  });

  it('decrypts a value produced by the real Go implementation', () => {
    // Gerado rodando internal/crypto/crypto.go original (via Docker,
    // golang:1.22-alpine) com FIELD_ENCRYPT_KEY=test-key-for-cross-language-check-32
    // e EncryptFloat64(1234.56) -> comprova compatibilidade byte a byte.
    const service = new FieldEncryptionService();
    const goEncrypted = '8juwfMpFHeTefo9AFArv5ZFjq9d3bA2dBNHwllezZhvkPAA';

    expect(service.decryptFloat(goEncrypted)).toBeCloseTo(1234.56, 10);
  });

  it('round-trips values encrypted by itself', () => {
    const service = new FieldEncryptionService();

    for (const value of [0, 1, -1, 42.5, 1234.56, 99999.99, 0.01]) {
      const encrypted = service.encryptFloat(value);
      expect(service.decryptFloat(encrypted)).toBeCloseTo(value, 10);
    }
  });

  it('produces a different ciphertext each time (random nonce)', () => {
    const service = new FieldEncryptionService();
    const a = service.encryptFloat(1234.56);
    const b = service.encryptFloat(1234.56);
    expect(a).not.toEqual(b);
  });

  it('falls back to a bare unencrypted float string (pre-encryption legacy rows)', () => {
    const service = new FieldEncryptionService();
    expect(service.decryptFloat('42.5')).toBeCloseTo(42.5, 10);
  });

  it('throws for FIELD_ENCRYPT_KEY missing', () => {
    delete process.env.FIELD_ENCRYPT_KEY;
    const service = new FieldEncryptionService();
    expect(() => service.encryptFloat(1)).toThrow(
      'FIELD_ENCRYPT_KEY não definida',
    );
  });
});
