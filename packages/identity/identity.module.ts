import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { IdentityPersistenceModule } from './persistence/identity-persistence.module';
import { AuthService } from './core/services/auth.service';
import { LocalUserStrategy } from './core/strategies/local_user.strategy';
import { GoogleOauthUserStrategy } from './core/strategies/googleAuthUser.strategy';
import { JwtStrategy } from './core/strategies/jwt.strategy';
import { RefreshStrategy } from './core/strategies/refresh.strategy';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard';
import { RolesGuard } from './core/guards/roles.guard';
import { UsersService } from './core/services/users.service';
import { ScheduleModule } from '@nestjs/schedule';
import { LastActivityService } from './core/schedules/last-activity.schedule';
import refreshJwtConfig from './config/refresh-jwt.config';
import jwtConfig from './config/jwt.config';
import googleOauthConfig from './config/google.oauth.config';
import { LoggerModule } from 'shared/modules/loggers/logger.module';
import { AuthController } from './http/auth.controller';
import { UsersController } from './http/users.controller';
import { IdentityIntegrationModule } from './integration/identity.integration';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
    ConfigModule.forFeature(googleOauthConfig),
    IdentityPersistenceModule,
    PassportModule.register({ defaultStrategy: 'bearer' }),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ScheduleModule.forRoot(),

    IdentityIntegrationModule,
  ],
  controllers: [AuthController, UsersController],
  providers: [
    UsersService,
    AuthService,
    LocalUserStrategy,
    GoogleOauthUserStrategy,
    JwtStrategy,
    RefreshStrategy,
    ...(process.env.NODE_ENV !== 'test' ? [LastActivityService] : []),
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, //@UseGuards(JwtAuthGuard) applied on all API endppints
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, //@Roles([UserRoles.Administrador]) applied on all API endppints
    },
  ],
  exports: [AuthService],
})
export class IdentityModule {}
