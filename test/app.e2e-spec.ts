import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { setupTestApp, teardownTestApp } from './test-utils';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const testSetup = await setupTestApp();
    app = testSetup.app;
  });

  afterEach(async () => {
    await teardownTestApp(app);
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ data: { status: 'ok' } });
  });
});
