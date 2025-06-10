import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Observable } from 'rxjs';
import { LoggerService } from '../loggers/domain/logger.service';

@Injectable()
export class LastActivityInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private loggerService: LoggerService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    try {
      const req = context.switchToHttp().getRequest();
      const user = req.user;

      if (user?.sub) {
        try {
          const key = `user:lastLogin:${user.sub}`;
          const now = new Date().toISOString();

          await this.cacheManager.set(key, now, 60 * 30);

          const existingIds = (await this.cacheManager.get<string[]>('user:loginQueue')) || [];
          if (!existingIds.includes(user.sub)) {
            existingIds.push(user.sub);
            await this.cacheManager.set('user:loginQueue', existingIds, 60 * 60 * 24);
          }

          this.loggerService.debug(`Atualizada última atividade para usuário ${user.sub}`);
        } catch (cacheError) {
          // Não falhar a requisição se o cache não estiver disponível
          this.loggerService.warn(`Erro ao atualizar cache de atividade: ${cacheError.message}`, {
            slack: true,
          });
        }
      }
    } catch (error) {
      // Não falhar a requisição se houver qualquer erro no interceptor
      this.loggerService.error(`Erro no interceptor de atividade: ${error.message}`, {
        slack: true,
      });
    }

    return next.handle();
  }
}
