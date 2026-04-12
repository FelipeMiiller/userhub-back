import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1775954257745 implements MigrationInterface {
  name = 'Migration1775954257745';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Índices parciais (WHERE "DeletedAt" IS NULL) ──────────────────────────
    // Substitui os índices totais por índices que cobrem apenas registros ativos.
    // Queries do sistema sempre filtram por DeletedAt IS NULL — índices parciais
    // são menores, mais rápidos e permitem reuso de valores únicos após soft-delete.

    // Accounts
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_accounts_email_active" ON "Accounts" ("Email") WHERE "DeletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_accounts_hash_refresh_token_active" ON "Accounts" ("HashRefreshToken") WHERE "DeletedAt" IS NULL`);

    // Profiles
    await queryRunner.query(`CREATE INDEX "IDX_profiles_email_active" ON "Profiles" ("Email") WHERE "DeletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_profiles_account_id_active" ON "Profiles" ("AccountId") WHERE "DeletedAt" IS NULL`);

    // Addresses
    await queryRunner.query(`CREATE INDEX "IDX_addresses_profile_id_active" ON "Addresses" ("ProfileId") WHERE "DeletedAt" IS NULL`);

    // Tenants
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_tenants_slug_active" ON "Tenants" ("Slug") WHERE "DeletedAt" IS NULL`);

    // AccountTenants
    await queryRunner.query(`CREATE INDEX "IDX_account_tenants_account_id_active" ON "AccountTenants" ("AccountId") WHERE "DeletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_account_tenants_tenant_id_active" ON "AccountTenants" ("TenantId") WHERE "DeletedAt" IS NULL`);

    // TenantRoles
    await queryRunner.query(`CREATE INDEX "IDX_tenant_roles_tenant_id_active" ON "TenantRoles" ("TenantId") WHERE "DeletedAt" IS NULL`);

    // Permissions
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_permissions_name_active" ON "Permissions" ("Name") WHERE "DeletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_permissions_module_id_active" ON "Permissions" ("ModuleId") WHERE "DeletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_permissions_resource_id_active" ON "Permissions" ("ResourceId") WHERE "DeletedAt" IS NULL`);

    // TenantRolePermissions
    await queryRunner.query(`CREATE INDEX "IDX_tenant_role_permissions_role_id_active" ON "TenantRolePermissions" ("TenantRoleId") WHERE "DeletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_tenant_role_permissions_permission_id_active" ON "TenantRolePermissions" ("PermissionId") WHERE "DeletedAt" IS NULL`);

    // SystemModules
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_system_modules_slug_active" ON "SystemModules" ("Slug") WHERE "DeletedAt" IS NULL`);

    // SystemResources
    await queryRunner.query(`CREATE INDEX "IDX_system_resources_module_id_active" ON "SystemResources" ("ModuleId") WHERE "DeletedAt" IS NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_system_resources_slug_active" ON "SystemResources" ("Slug") WHERE "DeletedAt" IS NULL`);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION sync_profile_email_on_account_update()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW."Email" IS DISTINCT FROM OLD."Email" THEN
          UPDATE "Profiles"
          SET "Email" = NEW."Email"
          WHERE "AccountId" = NEW."Id"
            AND "DeletedAt" IS NULL;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_sync_profile_email_on_account_update
      AFTER UPDATE OF "Email" ON "Accounts"
      FOR EACH ROW
      EXECUTE FUNCTION sync_profile_email_on_account_update();
    `);

    // Caso 2: INSERT ou UPDATE em Profile → herda Email da Account automaticamente
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_profile_email_on_insert()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (TG_OP = 'INSERT' OR NEW."AccountId" IS DISTINCT FROM OLD."AccountId")
           AND NEW."AccountId" IS NOT NULL THEN
          SELECT "Email" INTO NEW."Email"
          FROM "Accounts"
          WHERE "Id" = NEW."AccountId"
            AND "DeletedAt" IS NULL;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_set_profile_email_on_insert
      BEFORE INSERT OR UPDATE OF "AccountId" ON "Profiles"
      FOR EACH ROW
      EXECUTE FUNCTION set_profile_email_on_insert();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_set_profile_email_on_insert ON "Profiles"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_profile_email_on_insert`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_sync_profile_email_on_account_update ON "Accounts"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS sync_profile_email_on_account_update`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_system_resources_slug_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_system_resources_module_id_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_system_modules_slug_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tenant_role_permissions_permission_id_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tenant_role_permissions_role_id_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_permissions_resource_id_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_permissions_module_id_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_permissions_name_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tenant_roles_tenant_id_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_account_tenants_tenant_id_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_account_tenants_account_id_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tenants_slug_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_addresses_profile_id_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_profiles_account_id_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_profiles_email_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_accounts_hash_refresh_token_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_accounts_email_active"`);
  }
}
