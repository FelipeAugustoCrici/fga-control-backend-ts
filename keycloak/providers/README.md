# Provider bcrypt do Keycloak

Necessário pra importar os hashes bcrypt existentes na tabela `users` sem forçar reset de senha
(ver `/home/felipe/.claude/plans/wobbly-munching-lampson.md`). O JAR não é versionado no repo —
baixe antes de subir o `docker compose` pela primeira vez:

```bash
curl -sL -o keycloak/providers/keycloak-bcrypt-1.7.0.jar \
  https://github.com/leroyguillaume/keycloak-bcrypt/releases/download/v1.7.0/keycloak-bcrypt-1.7.0.jar
```

Fonte: [leroyguillaume/keycloak-bcrypt](https://github.com/leroyguillaume/keycloak-bcrypt). Registra o
algoritmo de hash `bcrypt` (`credentialData.algorithm = "bcrypt"`, `hashIterations: 10`), usado pelo
script `scripts/migrate-users-to-keycloak.ts`.
