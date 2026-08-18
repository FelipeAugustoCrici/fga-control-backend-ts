/**
 * Migra os usuários existentes (tabela `users`, hashes bcrypt) pra dentro
 * do Keycloak, preservando a senha atual de cada um — ver
 * /home/felipe/.claude/plans/wobbly-munching-lampson.md.
 *
 * Insere direto nas tabelas `user_entity`/`credential` do Postgres do
 * Keycloak, em vez de usar a Admin REST API (`POST .../users` com um
 * `credentials` array): testado empiricamente contra Keycloak 26.0.8 e
 * confirmado que a API silenciosamente reidrata a credencial com o
 * provider de hash padrão (Argon2), ignorando o algorithm/hash fornecidos
 * — bug conhecido da comunidade, não documentado. Inserção direta no banco
 * é o caminho usado por outras migrações reais desse mesmo tipo.
 *
 * Lê `users` via `pg` puro (não o client Prisma gerado) de propósito: o
 * client Prisma 7 daqui usa imports estilo NodeNext (`./internal/class.js`)
 * que só resolvem depois de um `tsc` de verdade — é por isso que o app roda
 * via `nest build`/`nest start`, não `ts-node`. Pra um script standalone,
 * `pg` puro evita essa fricção inteira.
 *
 * Uso:
 *   npm run migrate:keycloak                # dry-run (padrão, não escreve nada)
 *   npm run migrate:keycloak -- --apply      # aplica de verdade
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { Client as PgClient } from 'pg';

const isApply = process.argv.includes('--apply');

interface AppUser {
  id: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  keycloak_migrated_at: Date | null;
}

async function main() {
  const keycloakDbUrl = process.env.KEYCLOAK_DB_URL;
  const realmName = process.env.KEYCLOAK_REALM;
  const appDbUrl = process.env.DATABASE_URL;
  if (!keycloakDbUrl || !realmName || !appDbUrl) {
    throw new Error(
      'KEYCLOAK_DB_URL, KEYCLOAK_REALM e DATABASE_URL precisam estar definidas no .env',
    );
  }

  const appDb = new PgClient({ connectionString: appDbUrl });
  const kcDb = new PgClient({ connectionString: keycloakDbUrl });
  await appDb.connect();
  await kcDb.connect();

  try {
    // Idempotente — garante a coluna mesmo em ambientes onde a migration
    // 031_keycloak_migrated_at.sql do repo Go ainda não rodou (ex: banco de
    // produção do backend-ts, que não aplica schema.sql no boot).
    await appDb.query(
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS keycloak_migrated_at TIMESTAMPTZ DEFAULT NULL',
    );

    const realmRow = await kcDb.query<{ id: string }>(
      'SELECT id FROM realm WHERE name = $1',
      [realmName],
    );
    if (realmRow.rows.length === 0) {
      throw new Error(
        `Realm "${realmName}" não encontrado no Keycloak — o docker-compose subiu e importou o realm?`,
      );
    }
    const realmId = realmRow.rows[0].id;

    const usersRes = await appDb.query<AppUser>(
      'SELECT id, email, password_hash, is_active, keycloak_migrated_at FROM users',
    );
    const users = usersRes.rows;
    console.log(
      `${users.length} usuário(s) em Postgres. Modo: ${isApply ? 'APPLY' : 'DRY-RUN'}.\n`,
    );

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const user of users) {
      const existing = await kcDb.query(
        'SELECT id FROM user_entity WHERE realm_id = $1 AND email = $2',
        [realmId, user.email],
      );
      if (existing.rows.length > 0) {
        console.log(`SKIP (já existe): ${user.email}`);
        skipped++;
        if (isApply && !user.keycloak_migrated_at) {
          await appDb.query(
            'UPDATE users SET keycloak_migrated_at = NOW() WHERE id = $1',
            [user.id],
          );
        }
        continue;
      }

      console.log(
        `${isApply ? 'CREATE' : '[dry-run] criaria'}: ${user.email} (${user.id}, ativo=${user.is_active})`,
      );
      if (!isApply) continue;

      try {
        await kcDb.query('BEGIN');
        await kcDb.query(
          `INSERT INTO user_entity
             (id, email, email_constraint, email_verified, enabled, username, realm_id, created_timestamp)
           VALUES ($1, $2, $2, true, $3, $2, $4, $5)`,
          [user.id, user.email, user.is_active, realmId, Date.now()],
        );
        await kcDb.query(
          `INSERT INTO credential
             (id, salt, type, user_id, created_date, user_label, secret_data, credential_data, priority)
           VALUES ($1, NULL, 'password', $2, $3, NULL, $4, $5, 10)`,
          [
            randomUUID(),
            user.id,
            Date.now(),
            JSON.stringify({ value: user.password_hash }),
            JSON.stringify({ hashIterations: 10, algorithm: 'bcrypt' }),
          ],
        );
        await kcDb.query('COMMIT');
        await appDb.query(
          'UPDATE users SET keycloak_migrated_at = NOW() WHERE id = $1',
          [user.id],
        );
        created++;
      } catch (err) {
        await kcDb.query('ROLLBACK');
        console.error(`FALHOU ${user.email}:`, err);
        failed++;
      }
    }

    console.log(
      `\nResumo: ${created} criado(s), ${skipped} já existia(m), ${failed} falhou(aram).`,
    );
    if (!isApply) {
      console.log('Dry-run — nada foi escrito. Rode com --apply pra aplicar.');
    }
  } finally {
    await kcDb.end();
    await appDb.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
