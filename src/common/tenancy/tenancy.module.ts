import { Global, Module } from '@nestjs/common';

import { CompaniesModule } from '../../modules/companies/companies.module';
import { WorkspaceResolverService } from './workspace-resolver.service';

@Global()
@Module({
  imports: [CompaniesModule],
  providers: [WorkspaceResolverService],
  exports: [WorkspaceResolverService],
})
export class TenancyModule {}
