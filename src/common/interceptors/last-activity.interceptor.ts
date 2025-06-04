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

@Injectable()
export class LastActivityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LastActivityInterceptor.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    try {
      const req = context.switchToHttp().getRequest();
      const user = req.user;

      if (user?.sub) {
        try {
          const key = `user:lastLogin:${user.sub}`;
          const now = new Date().toISOString();

          await this.cacheManager.set(key, now, 60 * 60 * 24);

          const existingIds = (await this.cacheManager.get<string[]>('user:loginQueue')) || [];
          if (!existingIds.includes(user.sub)) {
            existingIds.push(user.sub);
            await this.cacheManager.set('user:loginQueue', existingIds, 60 * 60 * 24);
          }

          this.logger.debug(`Atualizada última atividade para usuário ${user.sub}`);
        } catch (cacheError) {
          // Não falhar a requisição se o cache não estiver disponível
          this.logger.warn(`Erro ao atualizar cache de atividade: ${cacheError.message}`);
        }
      }
    } catch (error) {
      // Não falhar a requisição se houver qualquer erro no interceptor
      this.logger.error(`Erro no interceptor de atividade: ${error.message}`);
    }

    return next.handle();
  }
}
