import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1723809312769 implements MigrationInterface {
  name = 'CreateUsersTable1723809312769';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE User_role_enum AS ENUM ('ADMIN', 'USER', 'MODERATOR');
      CREATE TABLE "Users" (
        "Id" varchar(26) PRIMARY KEY,
        "Email" varchar(255) NOT NULL UNIQUE,
        "Password" varchar(255),
        "HashRefreshToken" varchar(255),
        "Role" User_role_enum NOT NULL DEFAULT 'USER',
        "Status" boolean NOT NULL DEFAULT true,
        "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
      CREATE INDEX "IDX_Users_Email" ON "Users" ("Email");
      CREATE INDEX "IDX_Users_HashRefreshToken" ON "Users" ("HashRefreshToken");

      CREATE TABLE "Profiles" (
        "Id" varchar(26) PRIMARY KEY,
        "UserId" varchar(26) NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
        "Name" varchar(255) NOT NULL,
        "LastName" varchar(255),
        "Bio" text,
        "AvatarUrl" varchar(255),
        "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
      CREATE INDEX "IDX_Profiles_UserId" ON "Profiles" ("UserId");
      CREATE INDEX "IDX_Profiles_Name" ON "Profiles" ("Name");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "Profiles";
      DROP INDEX IF EXISTS "IDX_Users_email";
      DROP INDEX IF EXISTS "IDX_Users_hashRefreshToken";
      DROP TABLE IF EXISTS "Users";
      DROP TYPE IF EXISTS User_role_enum; 
    `);
  }
}
