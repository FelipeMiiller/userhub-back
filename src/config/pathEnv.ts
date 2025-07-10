/**
 * Retorna o caminho do arquivo .env de acordo com o ambiente
 * Exemplo: .env.development, .env.production,.env.test
 */

export const pathEnv = (() => {
  const env = process.env.NODE_ENV?.trim();
  switch (env) {
    case 'test':
      return ['.env.test'];
    default:
      return ['.env'];
  }
})();
