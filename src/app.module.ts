import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { LoggerModule } from 'src/common/loggers/logger.module';
import { UsersModule } from 'src/modules/users/users.module';
import { UploadS3Module } from 'src/common/s3/uploader3.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import redisConfig from 'src/config/redis.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import mongoConfig from 'src/config/mongo.config';
import slackConfig from './config/slack.config';
import { pathEnv } from './config/pathEnv';
import appConfig from './config/app.config';
import typeormConfig from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [pathEnv],
      isGlobal: true,
      load: [appConfig, typeormConfig, mongoConfig, slackConfig],
    }),
    EventEmitterModule.forRoot(),
    // PrismaModule,
    BullModule.forRootAsync({
      imports: [ConfigModule.forRoot({ load: [redisConfig] })],
      useFactory: (configDatabase: ConfigType<typeof redisConfig>) => ({
        connection: {
          port: configDatabase.port,
          host: configDatabase.host,
        },
      }),
      inject: [redisConfig.KEY],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => configService.get('typeorm'),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongo.uri'),
      }),
    }),
    UploadS3Module,
    LoggerModule,
    UsersModule,
    AuthModule,
  ],

  exports: [ConfigModule],
})
export class AppModule {}
