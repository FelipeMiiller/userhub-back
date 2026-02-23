//https://docs.nestjs.com/standalone-applications

import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import typeormConfig, { TypeormConfig } from '../config/typeorm.config';
import { DataSource } from 'typeorm';
import { pathEnv } from '@hub/shared-module/config/util/pathEnv';


const getDataSource = async (): Promise<DataSource> => {
    const app = await NestFactory.createApplicationContext(
        ConfigModule.forRoot({
            load: [typeormConfig],
            envFilePath: pathEnv,
        }),
    );
    const configService = app.get(ConfigService);
    const config = configService.get('typeorm') as TypeormConfig;

    return new DataSource(config);
};

export default getDataSource();