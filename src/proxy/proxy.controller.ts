import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';

// Headers que nunca devem ser repassados literalmente (hop-by-hop ou
// recalculados pelo próprio fetch/Express).
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

/**
 * Proxy strangler-fig: qualquer rota /api/v1/* ainda não implementada
 * nativamente cai aqui e é encaminhada para o backend Go, repassando
 * Authorization/x-company-id/x-workspace-type sem alteração. Como os dois
 * backends compartilham JWT_SECRET, FIELD_ENCRYPT_KEY e a tabela `sessions`,
 * um token emitido por um é válido no outro.
 *
 * IMPORTANTE: este módulo deve ser o ÚLTIMO import em app.module.ts — no
 * Nest/Express as rotas são resolvidas por ordem de registro, então esse
 * catch-all mascararia controllers de slices já migrados se viesse antes.
 */
@Controller('api/v1')
export class ProxyController {
  @All('*splat')
  async proxy(@Req() req: Request, @Res() res: Response): Promise<void> {
    const goBackendUrl = process.env.GO_BACKEND_URL;
    if (!goBackendUrl) {
      res.status(502).json({ error: 'GO_BACKEND_URL não configurada' });
      return;
    }

    const target = new URL(req.originalUrl, goBackendUrl);

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined || HOP_BY_HOP_HEADERS.has(key.toLowerCase()))
        continue;
      headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }

    const hasBody = !['GET', 'HEAD'].includes(req.method);
    const body =
      hasBody && req.body && Object.keys(req.body as object).length > 0
        ? JSON.stringify(req.body)
        : undefined;

    let upstream: globalThis.Response;
    try {
      upstream = await fetch(target, {
        method: req.method,
        headers,
        body,
        redirect: 'manual',
      });
    } catch {
      res.status(502).json({ error: 'backend Go indisponível' });
      return;
    }

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  }
}
