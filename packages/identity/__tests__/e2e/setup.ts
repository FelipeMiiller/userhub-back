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
    imports: [
      ConfigModule.forRoot({ isGlobal: true, envFilePath: pathEnv }),
      IdentityModule,
    ],
  }).compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new TransformInterceptor());
  await app.init();

  const dataSource = app.get<DataSource>(getDataSourceToken('identity'));
  await dataSource.runMigrations();

  return { app, dataSource };
}
