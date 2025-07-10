//https://docs.nestjs.com/standalone-applications

import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { pathEnv } from 'src/config/pathEnv';

import typeormConfig from 'src/config/typeorm.config';
import { DataSource } from 'typeorm';

const getDataSource = async (): Promise<DataSource> => {
  const app = await NestFactory.createApplicationContext(
    ConfigModule.forRoot({
      load: [typeormConfig],
      envFilePath: pathEnv,
    }),
  );
  const configService = app.get(ConfigService);
  const config: ConfigType<typeof typeormConfig> = configService.get('typeorm');

  return new DataSource(config);
};

export default getDataSource();
