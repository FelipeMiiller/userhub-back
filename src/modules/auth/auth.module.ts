import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import jwtConfig from 'src/config/jwt.config';
import { AuthController } from './http/auth.controller';
import { AuthService } from './domain/auth.service';
import { JwtAuthGuard } from './domain/guards/jwt-auth.guard';
import { RolesGuard } from './domain/guards/roles.guard';
import { GoogleOauthUserStrategy } from './domain/strategies/googleAuthUser.stategy';
import { LocalUserStrategy } from './domain/strategies/local_user.strategy';
import refreshJwtConfig from 'src/config/refresh-jwt.config';
import googleOauthConfig from 'src/config/google.oauth.config';
import { RefreshStrategy } from './domain/strategies/refresh.strategy';
import { UserEntity } from 'src/modules/users/domain/entities/users.entities';
import { ProfileEntity } from 'src/modules/users/domain/entities/profile.entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/modules/users/users.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, ProfileEntity]),
    PassportModule.register({ defaultStrategy: 'bearer' }),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(refreshJwtConfig),
    ConfigModule.forFeature(googleOauthConfig),
    forwardRef(() => UsersModule), // Use forwardRef to handle circular dependency
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalUserStrategy,
    GoogleOauthUserStrategy,

    RefreshStrategy,
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
export class AuthModule {}
