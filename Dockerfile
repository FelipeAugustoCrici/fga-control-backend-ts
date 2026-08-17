# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

# Sem isso, `prisma generate` não detecta a versão do libssl e cai num modo
# de fallback que gera um client.js quebrado (requer arquivos .ts que não
# existem no runtime, em vez dos .js compilados) — descoberto comparando um
# build local (com openssl disponível) contra o build da Railway (sem).
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma.config.ts ./
COPY prisma ./prisma
# Gera src/generated/prisma (client TS puro, sem engine nativa — modo
# query-compiler via @prisma/adapter-pg) a partir do schema já introspectado.
RUN npx prisma generate

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 8080
CMD ["node", "dist/main.js"]
