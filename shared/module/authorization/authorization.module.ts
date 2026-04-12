import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard';
import { RolesGuard } from './core/guards/roles.guard';
import { PermissionGuard } from './core/guards/permission.guard';
import { Global, Module } from '@nestjs/common';
import { AuthorizationService } from './core/services/authorization.service';
import { TokenDenylistService } from './core/services/token-denylist.service';
import { SharedCacheRedisModule } from '@hub/shared-module/cache';
import jwtConfig from './config/jwt.config';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    PassportModule.register({ defaultStrategy: 'bearer' }),
    SharedCacheRedisModule,
  ],
  controllers: [],
  providers: [
    AuthorizationService,
    TokenDenylistService,
    PermissionGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, //@UseGuards(JwtAuthGuard) applied on all API endppints
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, //@Roles([UserRoles.Administrador]) applied on all API endppints
    },
  ],
  exports: [AuthorizationService, TokenDenylistService, JwtModule, PermissionGuard],
})
export class AuthorizationModule {}
