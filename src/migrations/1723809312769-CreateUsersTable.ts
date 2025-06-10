import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1723809312769 implements MigrationInterface {
  name = 'CreateUsersTable1723809312769';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE User_role_enum AS ENUM ('ADMIN', 'USER');
      CREATE TABLE "Users" (
        "Id" varchar(26) PRIMARY KEY,
        "Email" varchar(255) NOT NULL UNIQUE,
        "Name" varchar(100) NOT NULL,
        "LastName" varchar(100),
        "Password" varchar(255),
        "HashRefreshToken" varchar(255),
        "Role" User_role_enum NOT NULL DEFAULT 'USER',
        "Status" boolean NOT NULL DEFAULT true,
        "AvatarUrl" varchar(255),
        "LastLoginAt" TIMESTAMP WITH TIME ZONE NULL,
        "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
        "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now());
      CREATE INDEX "IDX_Users_LastLoginAt" ON "Users" ("LastLoginAt");
      CREATE INDEX "IDX_Users_Email" ON "Users" ("Email");
      CREATE INDEX "IDX_Users_HashRefreshToken" ON "Users" ("HashRefreshToken");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_Users_LastLoginAt";
      DROP INDEX IF EXISTS "IDX_Users_Email";
      DROP INDEX IF EXISTS "IDX_Users_HashRefreshToken";
      DROP TABLE IF EXISTS "Users";
      DROP TYPE IF EXISTS User_role_enum; 
    `);
  }
}
