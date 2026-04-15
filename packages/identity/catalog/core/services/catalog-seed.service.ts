import { Injectable, OnModuleInit } from '@nestjs/common';
import { IDENTITY_MODULE_CATALOG, IdentityPermissions } from '@hub/shared-module/authorization';
import { FindOptionsWhere } from 'typeorm';
import { SystemModuleRepository } from '../../../persistence/repository/system-module.typeorm.repository';
import { SystemResourceRepository } from '../../../persistence/repository/system-resource.typeorm.repository';
import { PermissionRepository } from '../../../persistence/repository/permission.typeorm.repository';
import { SystemModule } from '../../../persistence/entities/modules.entities';
import { SystemResource } from '../../../persistence/entities/resources.entities';
import { Permission } from '../../../persistence/entities/permissions.entities';

/**
 * Seed automático do catálogo de módulos, recursos e permissões.
 *
 * Executa no boot da aplicação (OnModuleInit). É idempotente — usa createOrRestore
 * baseado no slug/name, portanto seguro para rodar múltiplas vezes.
 * Registros soft-deleted são restaurados automaticamente.
 *
 * Fontes de verdade:
 *  - Módulos e recursos: IDENTITY_MODULE_CATALOG (shared/module/authorization)
 *  - Permissões: IdentityPermissions (formato `{module}.{resource}.{action}`)
 */
@Injectable()
export class CatalogSeedService implements OnModuleInit {
  constructor(
    private readonly moduleRepo: SystemModuleRepository,
    private readonly resourceRepo: SystemResourceRepository,
    private readonly permissionRepo: PermissionRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedModulesAndResources();
    await this.seedPermissions();
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private async seedModulesAndResources(): Promise<void> {
    for (const catalogEntry of IDENTITY_MODULE_CATALOG) {
      const mod = await this.moduleRepo.createOrRestore(
        { Slug: catalogEntry.slug } as FindOptionsWhere<SystemModule>,
        {
          Slug: catalogEntry.slug,
          Name: catalogEntry.name,
          Description: catalogEntry.description,
          Active: true,
        },
      );

      for (const res of catalogEntry.resources) {
        await this.resourceRepo.createOrRestore(
          { Slug: res.slug, ModuleId: mod.Id } as FindOptionsWhere<SystemResource>,
          {
            Slug: res.slug,
            Name: res.name,
            ModuleId: mod.Id,
            Active: true,
          },
        );
      }
    }
  }

  private async seedPermissions(): Promise<void> {
    for (const permName of Object.values(IdentityPermissions)) {
      const parts = permName.split('.');
      if (parts.length !== 3) continue;
      const [moduleSlug, resourceSlug, action] = parts;

      const mod = await this.moduleRepo.findBySlug(moduleSlug);
      if (!mod) continue;

      const resource = await this.resourceRepo.findBySlugAndModule(resourceSlug, mod.Id);
      if (!resource) continue;

      await this.permissionRepo.createOrRestore(
        { Name: permName } as FindOptionsWhere<Permission>,
        {
          Name: permName,
          Action: action,
          ModuleId: mod.Id,
          ResourceId: resource.Id,
        },
      );
    }
  }
}
