import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { getDataSourceToken } from '@nestjs/typeorm';
import { TransformInterceptor } from 'shared/lib/core/interceptors/transform.interceptor';
import { IdentityModule } from '../../identity.module';
import { ConfigModule } from '@nestjs/config';
import { pathEnv } from 'shared/module/config';

export interface IdentityTestApp {
  app: INestApplication;
  dataSource: DataSource;
}

/**
 * Cria o app NestJS de teste para a identity package.
 * Usa o token correto para o DataSource nomeado 'identity'.
 */
export async function createIdentityApp(): Promise<IdentityTestApp> {
  initializeTransactionalContext();

  const module = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: pathEnv }), IdentityModule],
  }).compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new TransformInterceptor());
  await app.init();

  const dataSource = app.get<DataSource>(getDataSourceToken('identity'));
  await dataSource.dropDatabase();
  await dataSource.runMigrations();

  return { app, dataSource };
}

/**
 * Upserts permission rows into the DB and inserts grants into AccountTenantPermissions.
 *
 * Permission names follow the format `{module}.{resource}.{action}`.
 * The identity SystemModule and its resources are upserted automatically.
 * Existing grants for the AccountTenant are removed before inserting the new list.
 */
export async function grantPermissionsViaTable(
  dataSource: DataSource,
  accountId: string,
  tenantId: string,
  permissionNames: string[],
): Promise<void> {
  // Upsert identity SystemModule
  await dataSource.query(
    `INSERT INTO "SystemModules" ("Id", "Slug", "Name", "Active", "CreatedAt", "UpdatedAt")
     VALUES (gen_random_uuid(), 'identity', 'Identity', true, NOW(), NOW())
     ON CONFLICT ("Slug") DO NOTHING`,
  );
  const [mod]: Array<{ Id: string }> = await dataSource.query(
    `SELECT "Id" FROM "SystemModules" WHERE "Slug" = 'identity'`,
  );

  // Collect unique resource slugs (second segment of permission name)
  const resourceSlugs = [...new Set(permissionNames.map((n) => n.split('.')[1]))];

  // Upsert SystemResources
  for (const slug of resourceSlugs) {
    const [existing]: Array<{ Id: string }> = await dataSource.query(
      `SELECT "Id" FROM "SystemResources" WHERE "Slug" = $1 AND "ModuleId" = $2`,
      [slug, mod.Id],
    );
    if (!existing) {
      await dataSource.query(
        `INSERT INTO "SystemResources" ("Id", "Slug", "Name", "Active", "ModuleId", "CreatedAt", "UpdatedAt")
         VALUES (gen_random_uuid(), $1, $1, true, $2, NOW(), NOW())`,
        [slug, mod.Id],
      );
    }
  }

  // Upsert Permissions
  for (const permName of permissionNames) {
    const [, resourceSlug, action] = permName.split('.');
    const [res]: Array<{ Id: string }> = await dataSource.query(
      `SELECT "Id" FROM "SystemResources" WHERE "Slug" = $1 AND "ModuleId" = $2`,
      [resourceSlug, mod.Id],
    );
    if (!res) continue;
    await dataSource.query(
      `INSERT INTO "Permissions" ("Id", "Name", "Action", "ModuleId", "ResourceId", "CreatedAt", "UpdatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT ("Name") DO NOTHING`,
      [permName, action, mod.Id, res.Id],
    );
  }

  // Get AccountTenant
  const [at]: Array<{ Id: string }> = await dataSource.query(
    `SELECT "Id" FROM "AccountTenants" WHERE "AccountId" = $1 AND "TenantId" = $2`,
    [accountId, tenantId],
  );
  if (!at) return;

  // Clear existing extra permissions for this membership (idempotent)
  await dataSource.query(`DELETE FROM "AccountTenantPermissions" WHERE "AccountTenantId" = $1`, [
    at.Id,
  ]);

  // Insert grants
  for (const permName of permissionNames) {
    const [perm]: Array<{ Id: string }> = await dataSource.query(
      `SELECT "Id" FROM "Permissions" WHERE "Name" = $1`,
      [permName],
    );
    if (!perm) continue;
    await dataSource.query(
      `INSERT INTO "AccountTenantPermissions" ("Id", "AccountTenantId", "PermissionId", "Mode", "CreatedAt", "UpdatedAt")
       VALUES (gen_random_uuid(), $1, $2, 'grant', NOW(), NOW())`,
      [at.Id, perm.Id],
    );
  }
}
