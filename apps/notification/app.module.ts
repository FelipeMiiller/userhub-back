import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { pathEnv } from 'shared/lib/utils/pathEnv';
import { NotificationModule } from 'packages/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [],
      envFilePath: pathEnv,
    }),
    NotificationModule,
  ],
})
export class AppModule {}
