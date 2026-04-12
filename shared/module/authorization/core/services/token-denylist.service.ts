import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

const DENYLIST_PREFIX = 'jwt:denied:';

@Injectable()
export class TokenDenylistService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  /**
   * Adiciona um jti à denylist com TTL igual ao tempo restante do token.
   * Após o TTL expirar, a entrada é removida automaticamente do Redis.
   *
   * @param jti - Identificador único do token (campo jti do payload)
   * @param ttlSeconds - Tempo restante de vida do token em segundos
   */
  async revoke(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return; // token já expirado, nada a fazer
    await this.cache.set(`${DENYLIST_PREFIX}${jti}`, '1', ttlSeconds * 1000);
  }

  /**
   * Verifica se um jti está na denylist.
   *
   * @returns true se o token foi revogado, false se ainda é válido
   */
  async isRevoked(jti: string): Promise<boolean> {
    const value = await this.cache.get(`${DENYLIST_PREFIX}${jti}`);
    return value !== null && value !== undefined;
  }
}
