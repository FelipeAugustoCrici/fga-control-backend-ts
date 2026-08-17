import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../generated/prisma/client';

// Sem $connect() eager de propósito: o Prisma conecta sob demanda na
// primeira query. Isso mantém /health (e o boot do processo) independentes
// da disponibilidade do Postgres — só rotas que realmente tocam o banco
// falham se ele estiver fora do ar.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
