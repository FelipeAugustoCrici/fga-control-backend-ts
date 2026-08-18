import { Injectable, InternalServerErrorException } from '@nestjs/common';

/**
 * Cliente do Keycloak, única fonte de verdade das credenciais (ver
 * /home/felipe/.claude/plans/wobbly-munching-lampson.md — Fase 1 evoluiu de
 * "fallback pro bcrypt local" pra "Keycloak obrigatório": não existe mais
 * checagem de senha fora daqui). JWT/sessão próprios (jwt-auth.guard.ts,
 * tabela sessions) continuam intocados — só a verificação de senha mudou de
 * dono.
 */
@Injectable()
export class KeycloakService {
  private get baseUrl(): string {
    return `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`;
  }

  /**
   * true/false = o Keycloak confirmou se a senha bate; null = não deu pra
   * verificar (indisponível, timeout, erro inesperado). Não há mais
   * fallback local — um `null` aqui vira "login falhou" em LoginService,
   * não "tenta de outro jeito".
   */
  async verifyPassword(
    email: string,
    password: string,
  ): Promise<boolean | null> {
    try {
      const res = await fetch(
        `${this.baseUrl}/protocol/openid-connect/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'password',
            client_id: process.env.KEYCLOAK_CLIENT_ID!,
            client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
            username: email,
            password,
          }),
          signal: AbortSignal.timeout(3000),
        },
      );

      if (res.status === 200) return true;
      if (res.status === 400 || res.status === 401) return false; // invalid_grant: senha errada ou usuário não existe no realm
      return null; // status inesperado (5xx, etc) — não dá pra confiar na resposta
    } catch {
      return null; // rede fora do ar, timeout, DNS, container parado
    }
  }

  /**
   * Token de admin do próprio client backend-ts, via client_credentials —
   * usa o service account com a role manage-users (só isso, não é o
   * usuário admin master), reaproveitando o mesmo client_secret já usado
   * pro Direct Access Grant. Sem cache de propósito: operações de admin
   * (criar usuário, trocar senha) são raras, não vale a complexidade de
   * gerenciar expiração de token pra economizar uma chamada HTTP.
   */
  private async getServiceAccountToken(): Promise<string> {
    const res = await fetch(`${this.baseUrl}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      throw new InternalServerErrorException(
        'não foi possível autenticar com o Keycloak (service account)',
      );
    }
    const body = (await res.json()) as { access_token: string };
    return body.access_token;
  }

  /**
   * Cria o usuário no Keycloak com a senha em texto puro (o Keycloak hasheia
   * do jeito dele — diferente do import em massa da migração inicial, aqui
   * não estamos trazendo um hash bcrypt legado, é senha nova de verdade).
   * O UUID gerado pelo Keycloak não necessariamente bate com `users.id` do
   * Postgres — o Admin REST API ignora um `id` explícito na criação (ao
   * contrário do insert direto no banco que o script de migração faz); pra
   * login isso não importa, a verificação usa email, não UUID.
   */
  async createUser(email: string, password: string): Promise<void> {
    const token = await this.getServiceAccountToken();
    const res = await fetch(
      `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          email,
          enabled: true,
          emailVerified: true,
          credentials: [
            { type: 'password', value: password, temporary: false },
          ],
        }),
      },
    );
    if (!res.ok) {
      throw new InternalServerErrorException(
        `não foi possível criar o usuário no Keycloak (${res.status})`,
      );
    }
  }

  private async findUserId(
    email: string,
    token: string,
  ): Promise<string | null> {
    const res = await fetch(
      `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users?email=${encodeURIComponent(email)}&exact=true`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return null;
    const users = (await res.json()) as { id: string }[];
    return users[0]?.id ?? null;
  }

  /**
   * Troca a senha no Keycloak. Usado por ChangePasswordService — a senha
   * local (users.password_hash) deixou de ser o que o login checa, então
   * "trocar senha" só faz efeito de verdade se acontecer aqui também.
   */
  async updatePassword(email: string, newPassword: string): Promise<void> {
    const token = await this.getServiceAccountToken();
    const userId = await this.findUserId(email, token);
    if (!userId) {
      throw new InternalServerErrorException(
        'usuário não encontrado no Keycloak',
      );
    }
    const res = await fetch(
      `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/reset-password`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'password',
          value: newPassword,
          temporary: false,
        }),
      },
    );
    if (!res.ok) {
      throw new InternalServerErrorException(
        `não foi possível trocar a senha no Keycloak (${res.status})`,
      );
    }
  }
}
