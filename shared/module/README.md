# Módulos de Infraestrutura Compartilhada

Módulos de infraestrutura compartilhada são módulos que são utilizados por mais de um módulo da aplicação. Eles são responsáveis por prover funcionalidades comuns a todos os módulos, como por exemplo, a conexão com o banco de dados, a conexão com serviços externos, a autenticação, a autorização, etc.

Veja também: [packages/README.md](../../README.md) — documento principal que explica as delimitações entre `lib` e `modules`.

## Convenção e boas práticas

- Localização: coloque módulos reusáveis em `packages/shared/modules/<module-name>`.
- Nome do arquivo do módulo: use o sufixo `Module`, exemplo `authorization.module.ts` ou `cache-redis.module.ts`.
- Exporte um `barrel` (`index.ts`) na raiz do módulo que re-exporta os símbolos públicos (`export * from './cache-redis.module'`).
- Decida se o módulo é `@Global()` (use apenas quando for realmente global).
- Use `ConfigModule.forFeature(...)` para configurações específicas do módulo ou `registerAsync`/`forRootAsync` para integração com infra (DB, Redis).
- Exporte apenas os providers necessários via `exports: [...]` no `@Module`.

## Estrutura recomendada

- `packages/shared/modules/<module>/`:
  - `index.ts` (barrel)
  - `<module>.module.ts` (p. ex. `cache-redis.module.ts`)
  - `config/` (opcional)
  - `core/`, `http/`, `persistence/` (quando aplicável)

## Como importar em um AppModule

No `AppModule` do app (ex.: `apps/identity/app.module.ts`), importe o módulo compartilhado:

```ts
import { SharedCacheRedisModule } from 'packages/shared/modules/cache';

@Module({
  imports: [
    SharedCacheRedisModule,
    // ...outros módulos
  ],
})
export class AppModule {}
```

## Exemplo real

O repositório já inclui um módulo de cache: `packages/shared/modules/cache/cache-redis.module.ts` e o barrel `packages/shared/modules/cache/index.ts`.

## Checklist rápido antes do PR

- Adicione `index.ts` (barrel) no módulo para facilitar imports
- Confirme se o módulo precisa ser `@Global()`; caso contrário, exponha explicitamente via `exports`
- Tipagem completa e lints passando
- Adicione/atualize testes unitários ou e2e relevantes
- Atualize `packages/shared/lib/index.ts` se precisar expor o módulo no package `shared`
