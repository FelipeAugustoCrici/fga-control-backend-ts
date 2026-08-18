# Imagem de produção do Keycloak (Railway não suporta bind mount de arquivo
# como o docker-compose local usa) — embute o provider bcrypt e o realm.json
# na imagem via `kc.sh build`. Ver /home/felipe/.claude/plans/wobbly-munching-lampson.md.
FROM quay.io/keycloak/keycloak:26.0
COPY providers/keycloak-bcrypt-1.7.0.jar /opt/keycloak/providers/
COPY import/fga-control-realm.json /opt/keycloak/data/import/
ENV KC_DB=postgres
RUN /opt/keycloak/bin/kc.sh build
ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start", "--optimized", "--import-realm", "--hostname-strict=false", "--http-enabled=true", "--proxy-headers=xforwarded"]
