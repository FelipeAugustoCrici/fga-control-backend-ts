import { Module } from '@nestjs/common';

import { CreateWikiController } from './create-wiki/create-wiki.controller';
import { DeleteWikiController } from './delete-wiki/delete-wiki.controller';
import { GetWikiController } from './get-wiki/get-wiki.controller';
import { ListWikiController } from './list-wiki/list-wiki.controller';
import { UpdateWikiController } from './update-wiki/update-wiki.controller';
import { WikiRepository } from './wiki.repository';

// WorkspaceResolverService vem de TenancyModule (@Global), não precisa
// importar aqui.
@Module({
  controllers: [
    ListWikiController,
    CreateWikiController,
    UpdateWikiController,
    DeleteWikiController,
    GetWikiController,
  ],
  providers: [WikiRepository],
})
export class WikiModule {}
