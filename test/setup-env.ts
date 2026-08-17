// Executado pelo Jest (setupFiles) antes de qualquer arquivo de teste ser
// importado — precisa rodar antes do AppModule ser carregado, já que
// ConfigModule.forRoot({ validate }) valida o ambiente de forma síncrona
// no momento em que o decorator @Module() é avaliado.
process.env.DATABASE_URL ??= 'postgresql://user:pass@localhost:5432/db';
process.env.JWT_SECRET ??= 'test-secret';
process.env.FIELD_ENCRYPT_KEY ??= 'test-key';
