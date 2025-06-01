/**
 * Retorna o caminho do arquivo .env de acordo com o ambiente
 * Exemplo: .env.development, .env.production, ou .env
 */

export const pathEnv = (() => {
  const env = process.env.NODE_ENV?.trim();
  switch (env) {
    case 'development':
      return `.env.${env}`;
    case 'production':
      return `.env.${env}`;
    case 'test':
      return `.env.${env}`;
    default:
      return `.env`;
  }
})();
// console.log('process.env', process.env);
// console.log('pathEnv', pathEnv);
