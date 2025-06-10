import { ConfigType } from '@nestjs/config';
import appConfig from './app.config';

export const getCorsOptions = (env: ConfigType<typeof appConfig>) => {
  const allowedOrigins = [env.origin, env.frontendUrl, ...env.accessibleIps].filter(Boolean);

  return {
    origin: function (origin: string, callback: (err: Error | null, allow?: boolean) => void) {
      // Permite requisições sem origem (como aplicativos mobile, curl, etc)
      if (!origin) return callback(null, true);

      // Verifica se a origem está na lista de origens permitidas
      if (
        allowedOrigins.some(
          (allowed) =>
            origin === allowed ||
            origin.startsWith(allowed) ||
            (allowed.includes('*') && new RegExp(allowed.replace(/\*/g, '.*')).test(origin)),
        )
      ) {
        return callback(null, true);
      }

      console.warn(`CORS bloqueado para origem: ${origin}`);
      return callback(new Error('Acesso não permitido por CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-Access-Token',
      'X-Refresh-Token',
    ],
    exposedHeaders: ['Authorization', 'X-Refresh-Token'],
    credentials: true,
    maxAge: 86400, // 24 horas
  };
};
