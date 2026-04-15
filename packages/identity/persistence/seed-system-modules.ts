import { DataSource } from 'typeorm';
import { IDENTITY_MODULE_CATALOG, IdentityPermissions } from '@hub/shared-module/authorization';
import { SystemModule } from './entities/modules.entities';
import { SystemResource } from './entities/resources.entities';
import { Permission } from './entities/permissions.entities';

/**
 * Seed de SystemModules, SystemResources e Permissions.
 *
 * Fonte de verdade:
 *  - Módulos/recursos: IDENTITY_MODULE_CATALOG
 *  - Permissões: IdentityPermissions (formato `{module}.{resource}.{action}`)
 *
 * Idempotente — seguro para reexecutar.
 */
export async function seedSystemModulesResourcesPermissions(dataSource: DataSource): Promise<void> {
  const moduleRepo = dataSource.getRepository(SystemModule);
  const resourceRepo = dataSource.getRepository(SystemResource);
  const permRepo = dataSource.getRepository(Permission);

  for (const entry of IDENTITY_MODULE_CATALOG) {
    let mod = await moduleRepo.findOneBy({ Slug: entry.slug });
    if (!mod) {
      mod = moduleRepo.create({
        Slug: entry.slug,
        Name: entry.name,
        Description: entry.description,
        Active: true,
      });
      await moduleRepo.save(mod);
    }

    for (const res of entry.resources) {
      const existing = await resourceRepo.findOneBy({ Slug: res.slug, ModuleId: mod.Id });
      if (!existing) {
        const resource = resourceRepo.create({
          Slug: res.slug,
          Name: res.name,
          ModuleId: mod.Id,
          Active: true,
        });
        await resourceRepo.save(resource);
      }
    }
  }

  for (const permName of Object.values(IdentityPermissions)) {
    const parts = permName.split('.');
    if (parts.length !== 3) continue;
    const [moduleSlug, resourceSlug, action] = parts;

    const mod = await moduleRepo.findOneBy({ Slug: moduleSlug });
    if (!mod) continue;
    const resource = await resourceRepo.findOneBy({ Slug: resourceSlug, ModuleId: mod.Id });
    if (!resource) continue;

    const existing = await permRepo.findOneBy({ Name: permName });
    if (!existing) {
      const perm = permRepo.create({
        Name: permName,
        Action: action,
        ModuleId: mod.Id,
        ResourceId: resource.Id,
      });
      await permRepo.save(perm);
    }
  }
}
