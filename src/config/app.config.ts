import { registerAs } from '@nestjs/config';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';
import validateConfig from 'src/common/utils/validate-config';
enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export type AppConfig = {
  port: number;
  environment: Environment;
  frontendDomain: string;
  corsConfig: any;
};

class EnvironmentVariablesValidator {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT: number;

  @IsUrl({ require_tld: false })
  @IsOptional()
  BACKEND_DOMAIN: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  FRONTEND_DOMAIN: string;

  @IsString()
  @IsOptional()
  CORS_ORIGINS: string;

  @IsString()
  @IsOptional()
  CORS_REGEX_PATTERNS: string;

  @IsBoolean()
  @IsOptional()
  CORS_DEBUG: boolean;

  @IsBoolean()
  @IsOptional()
  CORS_ALLOW_NO_ORIGIN: boolean;
}

export default registerAs('app', (): AppConfig => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  const originsEnv = process.env.CORS_ORIGINS || '';
  const regexPatternsEnv = process.env.CORS_REGEX_PATTERNS || '';

  // Origens estáticas
  const staticOrigins = originsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
    .map((origin) => (origin.endsWith('/') ? origin.slice(0, -1) : origin));

  // Padrões regex
  const regexPatterns = regexPatternsEnv
    .split(',')
    .map((pattern) => pattern.trim())
    .filter((pattern) => pattern.length > 0)
    .map((pattern) => {
      try {
        return new RegExp(pattern);
      } catch (error) {
        console.error(`❌ Invalid regex pattern: ${pattern}`, error);
        return null;
      }
    })
    .filter((pattern) => pattern !== null);

  // Função para validar origens
  const validateOrigin = (
    origin: string,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    const debug = process.env.CORS_DEBUG === 'true';

    if (debug) {
      console.log(`[CORS DEBUG] Validating origin: ${origin}`);
    }

    // Permite requisições sem origin se configurado
    if (!origin) {
      const allowNoOrigin = process.env.CORS_ALLOW_NO_ORIGIN === 'true';
      if (allowNoOrigin) {
        if (debug) console.log('[CORS DEBUG] ✅ No origin - allowed by configuration');
        return callback(null, true);
      } else {
        if (debug) console.log('[CORS DEBUG] ❌ No origin - rejected by configuration');
        return callback(new Error('Origin header required'));
      }
    }

    // Verifica origens estáticas
    if (staticOrigins.includes(origin)) {
      if (debug) console.log(`[CORS DEBUG] ✅ Static origin allowed: ${origin}`);
      return callback(null, true);
    }

    // Verifica padrões regex
    for (const pattern of regexPatterns) {
      if (pattern.test(origin)) {
        if (debug)
          console.log(`[CORS DEBUG] ✅ Regex pattern matched: ${pattern.source} -> ${origin}`);
        return callback(null, true);
      }
    }

    if (debug) {
      console.log(`[CORS DEBUG] ❌ Origin rejected: ${origin}`);
      console.log('[CORS DEBUG] Available static origins:', staticOrigins);
      console.log(
        '[CORS DEBUG] Available regex patterns:',
        regexPatterns.map((p) => p.source),
      );
    }

    callback(new Error('Not allowed by CORS'));
  };

  return {
    port: Number(process.env.PORT),
    environment: process.env.NODE_ENV as Environment,
    frontendDomain: process.env.FRONTEND_DOMAIN,
    corsConfig: {
      origin: validateOrigin,
      credentials: process.env.CORS_CREDENTIALS !== 'false',
      methods: process.env.CORS_METHODS?.split(',') || [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'PATCH',
        'OPTIONS',
      ],
      allowedHeaders: process.env.CORS_HEADERS?.split(',') || [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers',
      ],
      exposedHeaders: process.env.CORS_EXPOSED_HEADERS?.split(',') || ['Authorization'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    },
  };
});
