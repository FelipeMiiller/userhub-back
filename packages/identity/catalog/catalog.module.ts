import { Module } from '@nestjs/common';
import { SystemModuleService } from './core/services/system-module.service';
import { SystemResourceService } from './core/services/system-resource.service';
import { CatalogSeedService } from './core/services/catalog-seed.service';
import { SystemModuleController } from './http/rest/system-module.controller';
import { SystemResourceController } from './http/rest/system-resource.controller';

/**
 * CatalogModule — catálogo global de módulos e recursos da plataforma.
 *
 * Responsabilidades:
 *  - Seed automático (OnModuleInit) de SystemModules, SystemResources e
 *    Permissions a partir de IDENTITY_MODULE_CATALOG + IdentityPermissions
 *  - Leitura (GET-only) do catálogo via HTTP
 *
 * Sem CRUD manual: módulos e recursos são definidos em código e sincronizados
 * automaticamente — nenhum admin precisa criá-los pelo app.
 *
 * Separado do TenantModule: este módulo gerencia o catálogo da plataforma;
 * o TenantModule gerencia quais módulos cada tenant habilitou.
 */
@Module({
  controllers: [SystemModuleController, SystemResourceController],
  providers: [SystemModuleService, SystemResourceService, CatalogSeedService],
  exports: [SystemModuleService, SystemResourceService],
})
export class CatalogModule {}
