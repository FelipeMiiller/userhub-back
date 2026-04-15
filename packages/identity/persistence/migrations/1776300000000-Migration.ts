import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Consolidated migration — full identity schema from scratch.
 * Replaces all previous incremental migrations:
 *   1775608136301, 1775676224289, 1775954257745, 1776111244391,
 *   1776200000000, 1776167688541
 *
 * Final state:
 *  - UUID FK columns (AccountId, TenantId, TenantRoleId, PermissionId, ProfileId)
 *  - Partial indexes (WHERE "DeletedAt" IS NULL) for all active-record queries
 *  - Triggers for email propagation from Accounts → Profiles
 *  - AccountTenantPermissions table (replaces ExtraPermissions jsonb)
 *  - TenantModules table
 */
export class Migration1776300000000 implements MigrationInterface {
  name = 'Migration1776300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Tables (dependency order: referenced before referencing) ───────────────

    await queryRunner.query(`
      CREATE TABLE "Accounts" (
        "Id"               uuid                     NOT NULL,
        "CreatedAt"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "UpdatedAt"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "DeletedAt"        TIMESTAMP WITH TIME ZONE,
        "Email"            character varying(255)   NOT NULL,
        "Password"         character varying(255)   NOT NULL,
        "HashRefreshToken" character varying(255),
        "Provider"         character varying(50)    NOT NULL DEFAULT 'local',
        "ProviderId"       character varying(255),
        "ExternalId"       character varying(255),
        "EmailVerified"    boolean                  NOT NULL DEFAULT false,
        "Status"           boolean                  NOT NULL DEFAULT true,
        "ProfileId"        character varying(255),
        "Metadata"         jsonb,
        CONSTRAINT "PK_b00432274d4ff6167f757799b1a" PRIMARY KEY ("Id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "SystemModules" (
        "Id"          uuid                     NOT NULL,
        "CreatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "UpdatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "DeletedAt"   TIMESTAMP WITH TIME ZONE,
        "Slug"        character varying(100)   NOT NULL,
        "Name"        character varying(255)   NOT NULL,
        "Description" character varying(500),
        "Active"      boolean                  NOT NULL DEFAULT true,
        CONSTRAINT "PK_1a0601ef5a0a06141dc6ebe412d" PRIMARY KEY ("Id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "SystemResources" (
        "Id"          uuid                     NOT NULL,
        "CreatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "UpdatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "DeletedAt"   TIMESTAMP WITH TIME ZONE,
        "ModuleId"    uuid                     NOT NULL,
        "Slug"        character varying(100)   NOT NULL,
        "Name"        character varying(255)   NOT NULL,
        "Description" character varying(500),
        "Active"      boolean                  NOT NULL DEFAULT true,
        CONSTRAINT "PK_2c8520ec304f401afa23bc08217" PRIMARY KEY ("Id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "Profiles" (
        "Id"          uuid                     NOT NULL,
        "CreatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "UpdatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "DeletedAt"   TIMESTAMP WITH TIME ZONE,
        "FirstName"   character varying(100)   NOT NULL,
        "LastName"    character varying(100),
        "DisplayName" character varying(150),
        "Email"       character varying(255),
        "Phone"       character varying(30),
        "Photo"       character varying(500),
        "Cpf"         character varying(14),
        "BirthDate"   date,
        "AccountId"   uuid,
        CONSTRAINT "PK_f8e4af27ec2538cacf23e883337" PRIMARY KEY ("Id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "Addresses" (
        "Id"           uuid                     NOT NULL,
        "CreatedAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "UpdatedAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "DeletedAt"    TIMESTAMP WITH TIME ZONE,
        "ProfileId"    uuid                     NOT NULL,
        "Type"         character varying(20)    NOT NULL DEFAULT 'home',
        "Street"       character varying(255)   NOT NULL,
        "Number"       character varying(20),
        "Complement"   character varying(100),
        "Neighborhood" character varying(100),
        "City"         character varying(100)   NOT NULL,
        "State"        character varying(50)    NOT NULL,
        "Country"      character varying(50)    NOT NULL DEFAULT 'BR',
        "ZipCode"      character varying(20),
        "Formatted"    character varying(500),
        "Latitude"     numeric(9,6),
        "Longitude"    numeric(9,6),
        CONSTRAINT "PK_09769027f6cac445bff3173c597" PRIMARY KEY ("Id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "Tenants" (
        "Id"        uuid                     NOT NULL,
        "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "DeletedAt" TIMESTAMP WITH TIME ZONE,
        "Name"      character varying(255)   NOT NULL,
        "Slug"      character varying(100)   NOT NULL,
        "Status"    character varying(20)    NOT NULL DEFAULT 'active',
        "Metadata"  jsonb,
        CONSTRAINT "PK_cb63dd4c01e802c3c396fc43ff8" PRIMARY KEY ("Id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "TenantRoles" (
        "Id"          uuid                     NOT NULL,
        "CreatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "UpdatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "DeletedAt"   TIMESTAMP WITH TIME ZONE,
        "TenantId"    uuid                     NOT NULL,
        "Name"        character varying(100)   NOT NULL,
        "Description" character varying(500),
        CONSTRAINT "PK_5efc3e2dea00025c77cd1c785cf" PRIMARY KEY ("Id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "AccountTenants" (
        "Id"           uuid                     NOT NULL,
        "CreatedAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "UpdatedAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "DeletedAt"    TIMESTAMP WITH TIME ZONE,
        "AccountId"    uuid                     NOT NULL,
        "TenantId"     uuid                     NOT NULL,
        "TenantRoleId" uuid,
        "Status"       character varying(20)    NOT NULL DEFAULT 'active',
        "Metadata"     jsonb,
        CONSTRAINT "UQ_eea74da68260c45aad873d4f404" UNIQUE ("AccountId", "TenantId"),
        CONSTRAINT "PK_7a60c55a2cd72dfd5c823ff12a3" PRIMARY KEY ("Id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "Permissions" (
        "Id"          uuid                     NOT NULL,
        "CreatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "UpdatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "DeletedAt"   TIMESTAMP WITH TIME ZONE,
        "Name"        character varying(255)   NOT NULL,
        "ModuleId"    uuid                     NOT NULL,
        "ResourceId"  uuid                     NOT NULL,
        "Action"      character varying(50)    NOT NULL,
        "Description" character varying(500),
        CONSTRAINT "PK_99fa50928aea3ac88937056e3dd" PRIMARY KEY ("Id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "TenantRolePermissions" (
        "Id"           uuid                     NOT NULL,
        "CreatedAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "UpdatedAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "DeletedAt"    TIMESTAMP WITH TIME ZONE,
        "TenantRoleId" uuid                     NOT NULL,
        "PermissionId" uuid                     NOT NULL,
        "AllowedLevel" integer                  NOT NULL DEFAULT '1',
        "Mode"         character varying(10)    NOT NULL DEFAULT 'allow',
        CONSTRAINT "PK_05d6e60ea545c0ffe151c4d919d" PRIMARY KEY ("Id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "TenantModules" (
        "Id"             uuid                     NOT NULL,
        "CreatedAt"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "UpdatedAt"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "DeletedAt"      TIMESTAMP WITH TIME ZONE,
        "TenantId"       uuid                     NOT NULL,
        "SystemModuleId" uuid                     NOT NULL,
        "Status"         character varying(20)    NOT NULL DEFAULT 'active',
        CONSTRAINT "UQ_99510e78be535ac2870c5e8b4d3" UNIQUE ("TenantId", "SystemModuleId"),
        CONSTRAINT "PK_b48529d2760eb54274b2462042e" PRIMARY KEY ("Id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "AccountTenantPermissions" (
        "Id"              uuid                     NOT NULL,
        "CreatedAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "UpdatedAt"       TIMESTAMP WITH TIME ZONE          DEFAULT now(),
        "DeletedAt"       TIMESTAMP WITH TIME ZONE,
        "AccountTenantId" uuid                     NOT NULL,
        "PermissionId"    uuid                     NOT NULL,
        "Mode"            character varying(10)    NOT NULL DEFAULT 'grant',
        CONSTRAINT "UQ_account_tenant_permission" UNIQUE ("AccountTenantId", "PermissionId", "Mode"),
        CONSTRAINT "PK_account_tenant_permissions" PRIMARY KEY ("Id")
      )
    `);

    // ── Foreign key constraints ────────────────────────────────────────────────

    await queryRunner.query(
      `ALTER TABLE "SystemResources" ADD CONSTRAINT "FK_a7c9444db2e45821c13bcef1312" FOREIGN KEY ("ModuleId") REFERENCES "SystemModules"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Permissions" ADD CONSTRAINT "FK_0b1a1998ee0bd580a8977cc52c5" FOREIGN KEY ("ModuleId") REFERENCES "SystemModules"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "Permissions" ADD CONSTRAINT "FK_60404c68eab504744351a4dfc56" FOREIGN KEY ("ResourceId") REFERENCES "SystemResources"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    // ── Indexes ────────────────────────────────────────────────────────────────

    await queryRunner.query(
      `CREATE INDEX "IDX_81309c7d83ea73e1a08c509dec" ON "Accounts" ("HashRefreshToken")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_9673a9ec99072a5d27a5f3d664" ON "Profiles" ("Email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d5e73e43a95ed58377a53ba733" ON "Profiles" ("AccountId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_dfc0865c78d13dec521b3f19a6" ON "Addresses" ("ProfileId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_b0720deeaca9470b828fcb98c8" ON "AccountTenants" ("AccountId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ad83209d8187cef0df459d2ea9" ON "AccountTenants" ("TenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_account_tenants_tenant_role_id" ON "AccountTenants" ("TenantRoleId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_9154dc3d7a97d889433f45c69d" ON "TenantRoles" ("TenantId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_0b1a1998ee0bd580a8977cc52c" ON "Permissions" ("ModuleId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_60404c68eab504744351a4dfc5" ON "Permissions" ("ResourceId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_5a9f05cefd27acfd8630104c37" ON "TenantRolePermissions" ("TenantRoleId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5d3aea3c342992214e48928781" ON "TenantRolePermissions" ("PermissionId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_a7c9444db2e45821c13bcef131" ON "SystemResources" ("ModuleId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1777131e383819c8a126a3226d" ON "SystemResources" ("Slug")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_4d32eb4402cb5999b775b6591c" ON "TenantModules" ("TenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f1b9fae9d74dbd0719c18b1530" ON "TenantModules" ("SystemModuleId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_atp_account_tenant_id" ON "AccountTenantPermissions" ("AccountTenantId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_atp_permission_id" ON "AccountTenantPermissions" ("PermissionId")`,
    );

    // ── Partial indexes (WHERE "DeletedAt" IS NULL) ────────────────────────────

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_accounts_email_active"             ON "Accounts"              ("Email")          WHERE "DeletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX        "IDX_accounts_hash_refresh_token_active" ON "Accounts"              ("HashRefreshToken") WHERE "DeletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX        "IDX_profiles_email_active"              ON "Profiles"              ("Email")            WHERE "DeletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX        "IDX_profiles_account_id_active"         ON "Profiles"              ("AccountId")        WHERE "DeletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX        "IDX_addresses_profile_id_active"        ON "Addresses"             ("ProfileId")        WHERE "DeletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_tenants_slug_active"                ON "Tenants"               ("Slug")             WHERE "DeletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX        "IDX_account_tenants_account_id_active"  ON "AccountTenants"        ("AccountId")        WHERE "DeletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX        "IDX_account_tenants_tenant_id_active"   ON "AccountTenants"        ("TenantId")         WHERE "DeletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX        "IDX_tenant_roles_tenant_id_active"      ON "TenantRoles"           ("TenantId")         WHERE "DeletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_permissions_name_active"            ON "Permissions"           ("Name")             WHERE "DeletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX        "IDX_permissions_module_id_active"       ON "Permissions"           ("ModuleId")         WHERE "DeletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX        "IDX_permissions_resource_id_active"     ON "Permissions"           ("ResourceId")       WHERE "DeletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX        "IDX_tenant_role_permissions_role_id_active"        ON "TenantRolePermissions" ("TenantRoleId")  WHERE "DeletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX        "IDX_tenant_role_permissions_permission_id_active"  ON "TenantRolePermissions" ("PermissionId")  WHERE "DeletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_system_modules_slug_active"         ON "SystemModules"         ("Slug")             WHERE "DeletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX        "IDX_system_resources_module_id_active"  ON "SystemResources"       ("ModuleId")         WHERE "DeletedAt" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX        "IDX_system_resources_slug_active"       ON "SystemResources"       ("Slug")             WHERE "DeletedAt" IS NULL`,
    );

    // ── Triggers ──────────────────────────────────────────────────────────────

    // Keeps Profiles.Email in sync when Accounts.Email is updated
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
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_sync_profile_email_on_account_update
      AFTER UPDATE OF "Email" ON "Accounts"
      FOR EACH ROW
      EXECUTE FUNCTION sync_profile_email_on_account_update()
    `);

    // Copies Email from Accounts to Profiles on INSERT or AccountId change
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
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_set_profile_email_on_insert
      BEFORE INSERT OR UPDATE OF "AccountId" ON "Profiles"
      FOR EACH ROW
      EXECUTE FUNCTION set_profile_email_on_insert()
    `);

    // Prevents Profile.Email from drifting when updated directly — re-reads from Account
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION enforce_profile_email_from_account()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW."AccountId" IS NOT NULL
           AND NEW."Email" IS DISTINCT FROM OLD."Email" THEN
          SELECT "Email" INTO NEW."Email"
          FROM "Accounts"
          WHERE "Id" = NEW."AccountId"
            AND "DeletedAt" IS NULL;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_enforce_profile_email_from_account
      BEFORE UPDATE OF "Email" ON "Profiles"
      FOR EACH ROW
      EXECUTE FUNCTION enforce_profile_email_from_account()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers and functions first (before dropping the tables they reference)
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_enforce_profile_email_from_account ON "Profiles"`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_profile_email_from_account`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_set_profile_email_on_insert ON "Profiles"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_profile_email_on_insert`);
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_sync_profile_email_on_account_update ON "Accounts"`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS sync_profile_email_on_account_update`);

    // Drop partial indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_system_resources_slug_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_system_resources_module_id_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_system_modules_slug_active"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_tenant_role_permissions_permission_id_active"`,
    );
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

    // Drop FK constraints
    await queryRunner.query(
      `ALTER TABLE "Permissions" DROP CONSTRAINT IF EXISTS "FK_60404c68eab504744351a4dfc56"`,
    );
    await queryRunner.query(
      `ALTER TABLE "Permissions" DROP CONSTRAINT IF EXISTS "FK_0b1a1998ee0bd580a8977cc52c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "SystemResources" DROP CONSTRAINT IF EXISTS "FK_a7c9444db2e45821c13bcef1312"`,
    );

    // Drop tables (leaf → root)
    await queryRunner.query(`DROP TABLE "AccountTenantPermissions"`);
    await queryRunner.query(`DROP TABLE "TenantModules"`);
    await queryRunner.query(`DROP TABLE "TenantRolePermissions"`);
    await queryRunner.query(`DROP TABLE "TenantRoles"`);
    await queryRunner.query(`DROP TABLE "AccountTenants"`);
    await queryRunner.query(`DROP TABLE "Permissions"`);
    await queryRunner.query(`DROP TABLE "SystemResources"`);
    await queryRunner.query(`DROP TABLE "SystemModules"`);
    await queryRunner.query(`DROP TABLE "Addresses"`);
    await queryRunner.query(`DROP TABLE "Profiles"`);
    await queryRunner.query(`DROP TABLE "Tenants"`);
    await queryRunner.query(`DROP TABLE "Accounts"`);
  }
}
