# fga-control-backend-ts

Reescrita incremental do backend Go (`fga-control-backend`) em TypeScript, usando **NestJS** como framework e **Prisma** como client de acesso a dados. O contrato de API (rotas `/api/v1/...`, formato JSON, headers) é mantido **idêntico** ao backend Go, para que o frontend existente continue funcionando sem alterações.

## Arquitetura

- **Vertical slice por caso de uso**: cada ação de negócio é uma pasta isolada com seu próprio controller, service e DTO — não um controller único por domínio inteiro.

  ```
  src/modules/<domínio>/
    <domínio>.repository.ts        # queries Prisma compartilhadas pelos casos de uso do domínio
    <caso-de-uso>/
      <caso-de-uso>.controller.ts
      <caso-de-uso>.service.ts
      <caso-de-uso>.dto.ts
  ```

- **`src/common/`**: camada compartilhada por todos os slices — Prisma (`common/prisma`), autenticação/sessão/JWT (`common/auth`), criptografia de campos financeiros (`common/crypto`), tratamento de erro e envelope de resposta (`common/http`), validação (`common/validation`).

- **`src/proxy/`**: proxy *strangler-fig*. Qualquer rota `/api/v1/*` ainda não implementada nativamente é encaminhada para o backend Go (`GO_BACKEND_URL`), repassando headers/corpo sem alteração. Migrar um slice é só implementar seus controllers — a existência deles já assume a rota, sem flag ou config extra.

  > ⚠️ `ProxyModule` **deve ser sempre o último import** em `src/app.module.ts`. No Nest/Express as rotas são resolvidas por ordem de registro (não por especificidade automática como no Next.js) — um catch-all registrado antes mascararia controllers de slices já migrados.

- **`/health`** fica fora do prefixo `/api/v1` (igual ao Go), usado pelo healthcheck do Railway.

- Convenções de resposta replicadas do Go (ver `src/common/http/response.util.ts`): `{"data": ...}` para leitura, `{"message": ...}` para mutação sem payload, paginação com `total/page/per_page` como irmãos de `data`. Erros sempre `{"error": "<mensagem>"}` (`src/common/http/http-exception.filter.ts`), 500 nunca vaza detalhe interno.

- **Casing de JSON é inconsistente por endpoint no Go original e deve ser replicado campo a campo, não normalizado** — alguns `Create*Input` usam camelCase (o que o frontend realmente envia), outros snake_case. Não uniformizar ao portar um slice.

## Banco de dados / Prisma

O **Go continua dono do schema** (`schema.sql`, aplicado no boot) durante toda a migração. O Prisma aqui é usado **só como client de query** — `prisma/schema.prisma` foi gerado por introspecção (`prisma db pull`) contra o banco real, e **não deve rodar `prisma migrate`** enquanto o Go ainda estiver ativo. Se o schema mudar no repositório Go, resincronize com:

```bash
npx prisma db pull
npx prisma generate
```

O client é gerado em modo "query compiler" puro (sem engine binária nativa), via `@prisma/adapter-pg` — por isso o generator em `schema.prisma` usa `moduleFormat = "cjs"` (o padrão do Prisma 7 é ESM, incompatível com o resto do projeto Nest/CommonJS).

## Variáveis de ambiente

Compartilhadas com o backend Go (**devem ter o mesmo valor nos dois serviços** durante a transição — os dois validam contra a mesma `sessions` table e os mesmos segredos):

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string do Postgres |
| `JWT_SECRET` | Segredo HS256 dos tokens — **sem fallback inseguro** (diferente do Go, que tem um default); o processo falha o boot se ausente |
| `FIELD_ENCRYPT_KEY` | Chave (SHA-256 derivada) da criptografia AES-256-GCM dos campos financeiros |
| `APP_ENV` | `development` \| `production` |
| `TZ` | **Precisa ser `America/Sao_Paulo`, igual ao `docker-compose.yml` do backend Go.** Usada pela lógica de data local de `modules/workdays` (atalhos "hoje"/"semana"/"mês" em `GET /workdays`) — sem isso, os limites de dia podem divergir do Go perto da meia-noite |

Exclusivas deste serviço:

| Variável | Descrição |
|---|---|
| `APP_PORT` | Porta HTTP (default `8080`) |
| `ALLOWED_ORIGINS` | Origens CORS, separadas por vírgula (default `http://localhost:5173,http://localhost:4173`) |
| `GO_BACKEND_URL` | URL interna do backend Go, usada só pelo proxy strangler-fig. Removida no corte final, quando o Go for aposentado |

## Rodando localmente

```bash
npm install
npx prisma generate        # gera src/generated/prisma a partir do schema.prisma versionado
npm run start:dev
```

Testes:

```bash
npm run test        # unitários (Jest)
npm run test:e2e    # e2e (sobe a aplicação completa; usa test/setup-env.ts para env dummy)
```

## Deploy (Railway)

Mesmo padrão do backend Go: `railway.toml` (`builder = "dockerfile"`, healthcheck em `/health`), `Dockerfile` multi-stage (`npx prisma generate` + `nest build` no builder, runtime só com `dist/` e dependências de produção). Deploy como serviço separado no **mesmo projeto Railway** do backend Go, compartilhando o Postgres — assim o proxy alcança o Go pela rede privada (`GO_BACKEND_URL=http://<serviço-go>.railway.internal:<porta>`).

## Roteiro de migração

Ver o plano de migração completo (fases, ordem dos slices, decisões de arquitetura) no histórico de planejamento da sessão que criou este projeto.
