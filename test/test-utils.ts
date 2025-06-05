import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

export async function setupTestApp(): Promise<{
  app: INestApplication;
  dataSource: DataSource;
  moduleFixture: TestingModule;
}> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const dataSource = app.get(DataSource);

  return { app, dataSource, moduleFixture };
}

export async function teardownTestApp(app: INestApplication): Promise<void> {
  try {
    if (app) {
      await app.close();
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (global.gc) {
      global.gc();
    }
  } catch (error) {
    console.error('Erro durante o teardown da aplicação de teste:', error);
  }
}
