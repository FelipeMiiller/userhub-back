import { DataSource } from 'typeorm';
import { SystemModule } from './entities/modules.entities';
import { SystemResource } from './entities/resources.entities';
import { Permission } from './entities/permissions.entities';

export async function seedSystemModulesResourcesPermissions(dataSource: DataSource) {
  // Exemplo de dados de seed
  const modules = [
    { Slug: 'identity', Name: 'Identity', Description: 'Identity and Access', Active: true },
    { Slug: 'billing', Name: 'Billing', Description: 'Billing and Payments', Active: true },
  ];

  const resources = [
    { Slug: 'accounts', Name: 'Accounts', Description: 'User accounts', Active: true, ModuleSlug: 'identity' },
    { Slug: 'profiles', Name: 'Profiles', Description: 'User profiles', Active: true, ModuleSlug: 'identity' },
  ];

  const permissions = [
    { Name: 'accounts.read', Action: 'read', Description: 'Read accounts', ResourceSlug: 'accounts', ModuleSlug: 'identity' },
    { Name: 'accounts.update', Action: 'update', Description: 'Update accounts', ResourceSlug: 'accounts', ModuleSlug: 'identity' },
    { Name: 'profiles.read', Action: 'read', Description: 'Read profiles', ResourceSlug: 'profiles', ModuleSlug: 'identity' },
  ];

  // Seed modules
  for (const mod of modules) {
    let moduleEntity = await dataSource.getRepository(SystemModule).findOneBy({ Slug: mod.Slug });
    if (!moduleEntity) {
      moduleEntity = dataSource.getRepository(SystemModule).create(mod);
      await dataSource.getRepository(SystemModule).save(moduleEntity);
    }
  }

  // Seed resources
  for (const res of resources) {
    const moduleEntity = await dataSource.getRepository(SystemModule).findOneBy({ Slug: res.ModuleSlug });
    if (!moduleEntity) continue;
    let resourceEntity = await dataSource.getRepository(SystemResource).findOneBy({ Slug: res.Slug, ModuleId: moduleEntity.Id });
    if (!resourceEntity) {
      resourceEntity = dataSource.getRepository(SystemResource).create({ ...res, ModuleId: moduleEntity.Id });
      await dataSource.getRepository(SystemResource).save(resourceEntity);
    }
  }

  // Seed permissions
  for (const perm of permissions) {
    const moduleEntity = await dataSource.getRepository(SystemModule).findOneBy({ Slug: perm.ModuleSlug });
    const resourceEntity = await dataSource.getRepository(SystemResource).findOneBy({ Slug: perm.ResourceSlug, ModuleId: moduleEntity?.Id });
    if (!moduleEntity || !resourceEntity) continue;
    let permissionEntity = await dataSource.getRepository(Permission).findOneBy({ Name: perm.Name });
    if (!permissionEntity) {
      permissionEntity = dataSource.getRepository(Permission).create({
        Name: perm.Name,
        Action: perm.Action,
        Description: perm.Description,
        ModuleId: moduleEntity.Id,
        ResourceId: resourceEntity.Id,
      });
      await dataSource.getRepository(Permission).save(permissionEntity);
    }
  }
}
