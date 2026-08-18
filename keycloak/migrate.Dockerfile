# Imagem descartável só pra rodar scripts/migrate-users-to-keycloak.ts como
# job avulso no Railway (não reaproveita a imagem de produção do backend-ts,
# que roda sem devDependencies / sem ts-node). Ver
# /home/felipe/.claude/plans/wobbly-munching-lampson.md — remover o serviço
# do Railway (e opcionalmente esta imagem do GHCR) depois de usada.
FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY scripts ./scripts
CMD sh -c "npx ts-node -r tsconfig-paths/register scripts/migrate-users-to-keycloak.ts $MIGRATE_ARGS"
