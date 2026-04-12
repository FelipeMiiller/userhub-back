import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775676224289 implements MigrationInterface {
    name = 'Migration1775676224289'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_28e2e5d02fa65c58916caee739"`);
        await queryRunner.query(`CREATE TABLE "SystemResources" ("Id" uuid NOT NULL, "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "DeletedAt" TIMESTAMP WITH TIME ZONE, "ModuleId" uuid NOT NULL, "Slug" character varying(100) NOT NULL, "Name" character varying(255) NOT NULL, "Description" character varying(500), "Active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_2c8520ec304f401afa23bc08217" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a7c9444db2e45821c13bcef131" ON "SystemResources" ("ModuleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1777131e383819c8a126a3226d" ON "SystemResources" ("Slug") `);
        await queryRunner.query(`CREATE TABLE "SystemModules" ("Id" uuid NOT NULL, "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "DeletedAt" TIMESTAMP WITH TIME ZONE, "Slug" character varying(100) NOT NULL, "Name" character varying(255) NOT NULL, "Description" character varying(500), "Active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_1a0601ef5a0a06141dc6ebe412d" PRIMARY KEY ("Id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e6db2178edd834aeb5a939ea6a" ON "SystemModules" ("Slug") `);
        await queryRunner.query(`ALTER TABLE "Accounts" DROP COLUMN "LastLoginAt"`);
        await queryRunner.query(`ALTER TABLE "Permissions" DROP COLUMN "Module"`);
        await queryRunner.query(`ALTER TABLE "Permissions" DROP COLUMN "Resource"`);
        await queryRunner.query(`ALTER TABLE "Permissions" ADD "ModuleId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Permissions" ADD "ResourceId" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_0b1a1998ee0bd580a8977cc52c" ON "Permissions" ("ModuleId") `);
        await queryRunner.query(`CREATE INDEX "IDX_60404c68eab504744351a4dfc5" ON "Permissions" ("ResourceId") `);
        await queryRunner.query(`ALTER TABLE "SystemResources" ADD CONSTRAINT "FK_a7c9444db2e45821c13bcef1312" FOREIGN KEY ("ModuleId") REFERENCES "SystemModules"("Id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Permissions" ADD CONSTRAINT "FK_0b1a1998ee0bd580a8977cc52c5" FOREIGN KEY ("ModuleId") REFERENCES "SystemModules"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "Permissions" ADD CONSTRAINT "FK_60404c68eab504744351a4dfc56" FOREIGN KEY ("ResourceId") REFERENCES "SystemResources"("Id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Permissions" DROP CONSTRAINT "FK_60404c68eab504744351a4dfc56"`);
        await queryRunner.query(`ALTER TABLE "Permissions" DROP CONSTRAINT "FK_0b1a1998ee0bd580a8977cc52c5"`);
        await queryRunner.query(`ALTER TABLE "SystemResources" DROP CONSTRAINT "FK_a7c9444db2e45821c13bcef1312"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_60404c68eab504744351a4dfc5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0b1a1998ee0bd580a8977cc52c"`);
        await queryRunner.query(`ALTER TABLE "Permissions" DROP COLUMN "ResourceId"`);
        await queryRunner.query(`ALTER TABLE "Permissions" DROP COLUMN "ModuleId"`);
        await queryRunner.query(`ALTER TABLE "Permissions" ADD "Resource" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Permissions" ADD "Module" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "Accounts" ADD "LastLoginAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e6db2178edd834aeb5a939ea6a"`);
        await queryRunner.query(`DROP TABLE "SystemModules"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1777131e383819c8a126a3226d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a7c9444db2e45821c13bcef131"`);
        await queryRunner.query(`DROP TABLE "SystemResources"`);
        await queryRunner.query(`CREATE INDEX "IDX_28e2e5d02fa65c58916caee739" ON "Accounts" ("LastLoginAt") `);
    }

}
