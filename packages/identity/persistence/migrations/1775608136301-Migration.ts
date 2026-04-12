import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775608136301 implements MigrationInterface {
    name = 'Migration1775608136301'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Accounts" ("Id" uuid NOT NULL, "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "DeletedAt" TIMESTAMP WITH TIME ZONE, "Email" character varying(255) NOT NULL, "Password" character varying(255) NOT NULL, "HashRefreshToken" character varying(255), "Provider" character varying(50) NOT NULL DEFAULT 'local', "ProviderId" character varying(255), "ExternalId" character varying(255), "EmailVerified" boolean NOT NULL DEFAULT false, "Status" boolean NOT NULL DEFAULT true, "LastLoginAt" TIMESTAMP WITH TIME ZONE, "ProfileId" character varying(255), "Metadata" jsonb, CONSTRAINT "UQ_0562eb17aa0b70ba2d6c94867df" UNIQUE ("Email"), CONSTRAINT "PK_b00432274d4ff6167f757799b1a" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0562eb17aa0b70ba2d6c94867d" ON "Accounts" ("Email") `);
        await queryRunner.query(`CREATE INDEX "IDX_81309c7d83ea73e1a08c509dec" ON "Accounts" ("HashRefreshToken") `);
        await queryRunner.query(`CREATE INDEX "IDX_28e2e5d02fa65c58916caee739" ON "Accounts" ("LastLoginAt") `);
        await queryRunner.query(`CREATE TABLE "Profiles" ("Id" uuid NOT NULL, "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "DeletedAt" TIMESTAMP WITH TIME ZONE, "FirstName" character varying(100) NOT NULL, "LastName" character varying(100), "DisplayName" character varying(150), "Email" character varying(255), "Phone" character varying(30), "Photo" character varying(500), "Cpf" character varying(14), "AccountId" character varying(255), CONSTRAINT "PK_f8e4af27ec2538cacf23e883337" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9673a9ec99072a5d27a5f3d664" ON "Profiles" ("Email") `);
        await queryRunner.query(`CREATE INDEX "IDX_d5e73e43a95ed58377a53ba733" ON "Profiles" ("AccountId") `);
        await queryRunner.query(`CREATE TABLE "Addresses" ("Id" uuid NOT NULL, "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "DeletedAt" TIMESTAMP WITH TIME ZONE, "ProfileId" character varying(255) NOT NULL, "Type" character varying(20) NOT NULL DEFAULT 'home', "Street" character varying(255) NOT NULL, "Number" character varying(20), "Complement" character varying(100), "Neighborhood" character varying(100), "City" character varying(100) NOT NULL, "State" character varying(50) NOT NULL, "Country" character varying(50) NOT NULL DEFAULT 'BR', "ZipCode" character varying(20), "Formatted" character varying(500), "Location" character varying(500), CONSTRAINT "PK_09769027f6cac445bff3173c597" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dfc0865c78d13dec521b3f19a6" ON "Addresses" ("ProfileId") `);
        await queryRunner.query(`CREATE TABLE "Tenants" ("Id" uuid NOT NULL, "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "DeletedAt" TIMESTAMP WITH TIME ZONE, "Name" character varying(255) NOT NULL, "Slug" character varying(100) NOT NULL, "Status" character varying(20) NOT NULL DEFAULT 'active', "Metadata" jsonb, CONSTRAINT "PK_cb63dd4c01e802c3c396fc43ff8" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_21a7e37dca9500c7164cccaf6e" ON "Tenants" ("Slug") `);
        await queryRunner.query(`CREATE TABLE "AccountTenants" ("Id" uuid NOT NULL, "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "DeletedAt" TIMESTAMP WITH TIME ZONE, "AccountId" character varying(255) NOT NULL, "TenantId" character varying(255) NOT NULL, "TenantRoleId" character varying(255), "Status" character varying(20) NOT NULL DEFAULT 'active', "ExtraPermissions" jsonb, "Metadata" jsonb, CONSTRAINT "UQ_eea74da68260c45aad873d4f404" UNIQUE ("AccountId", "TenantId"), CONSTRAINT "PK_7a60c55a2cd72dfd5c823ff12a3" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b0720deeaca9470b828fcb98c8" ON "AccountTenants" ("AccountId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ad83209d8187cef0df459d2ea9" ON "AccountTenants" ("TenantId") `);
        await queryRunner.query(`CREATE TABLE "TenantRoles" ("Id" uuid NOT NULL, "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "DeletedAt" TIMESTAMP WITH TIME ZONE, "TenantId" character varying(255) NOT NULL, "Name" character varying(100) NOT NULL, "Description" character varying(500), CONSTRAINT "PK_5efc3e2dea00025c77cd1c785cf" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9154dc3d7a97d889433f45c69d" ON "TenantRoles" ("TenantId") `);
        await queryRunner.query(`CREATE TABLE "Permissions" ("Id" uuid NOT NULL, "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "DeletedAt" TIMESTAMP WITH TIME ZONE, "Name" character varying(255) NOT NULL, "Module" character varying(100) NOT NULL, "Resource" character varying(100) NOT NULL, "Action" character varying(50) NOT NULL, "Description" character varying(500), CONSTRAINT "PK_99fa50928aea3ac88937056e3dd" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f685112ff526e2c420042c1368" ON "Permissions" ("Name") `);
        await queryRunner.query(`CREATE TABLE "TenantRolePermissions" ("Id" uuid NOT NULL, "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "DeletedAt" TIMESTAMP WITH TIME ZONE, "TenantRoleId" character varying(255) NOT NULL, "PermissionId" character varying(255) NOT NULL, "AllowedLevel" integer NOT NULL DEFAULT '1', "Mode" character varying(10) NOT NULL DEFAULT 'allow', CONSTRAINT "PK_05d6e60ea545c0ffe151c4d919d" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5a9f05cefd27acfd8630104c37" ON "TenantRolePermissions" ("TenantRoleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5d3aea3c342992214e48928781" ON "TenantRolePermissions" ("PermissionId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_5d3aea3c342992214e48928781"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5a9f05cefd27acfd8630104c37"`);
        await queryRunner.query(`DROP TABLE "TenantRolePermissions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f685112ff526e2c420042c1368"`);
        await queryRunner.query(`DROP TABLE "Permissions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9154dc3d7a97d889433f45c69d"`);
        await queryRunner.query(`DROP TABLE "TenantRoles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ad83209d8187cef0df459d2ea9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b0720deeaca9470b828fcb98c8"`);
        await queryRunner.query(`DROP TABLE "AccountTenants"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_21a7e37dca9500c7164cccaf6e"`);
        await queryRunner.query(`DROP TABLE "Tenants"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dfc0865c78d13dec521b3f19a6"`);
        await queryRunner.query(`DROP TABLE "Addresses"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d5e73e43a95ed58377a53ba733"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9673a9ec99072a5d27a5f3d664"`);
        await queryRunner.query(`DROP TABLE "Profiles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_28e2e5d02fa65c58916caee739"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_81309c7d83ea73e1a08c509dec"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0562eb17aa0b70ba2d6c94867d"`);
        await queryRunner.query(`DROP TABLE "Accounts"`);
    }

}
