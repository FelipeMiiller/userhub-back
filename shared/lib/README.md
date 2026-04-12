# Bibliotecas compartilhadas

Este diretório contém as bibliotecas compartilhadas do projeto. Tudo que é infraestrutura que não é um módulo e precisa ser compartilhado pode ser colocado aqui.

Veja também: [packages/README.md](../../README.md) — documento principal com as delimitações entre `lib` e `modules`.

## Convenções e boas práticas

- Localização: coloque utilitários e bibliotecas reutilizáveis em `packages/shared/lib/`.
- Barrel (`index.ts`): exporte símbolos públicos pelo `index.ts` do pacote para facilitar imports absolutos (ex.: `import { LoggerService } from 'packages/shared/lib'`).
- Organização: prefira subpastas por domínio funcional (`core/`, `test/`, `persistence/`, etc.).
- Nomes: mantenha nomes descritivos e evite exports por side-effects.

## Como expor um módulo ou utilitário

1. Crie o arquivo/serviço na subpasta apropriada (`core/`, `test/`, ...).
2. Exporte o símbolo do barrel local se necessário (ex.: `export * from './core/logger.service'`).
3. Registre a exportação no `packages/shared/lib/index.ts` para que consumidores possam importar usando o path do pacote.

Exemplo de export no `index.ts`:

```ts
// packages/shared/lib/index.ts
export * from './core/interceptors/logging.interceptor';
export * from './core/filters/service-exception.filter';
// Observação: módulos de infraestrutura ficam em `packages/shared/modules/*` e
// devem ser importados diretamente do seu pacote, exemplo:
// import { SharedCacheRedisModule } from 'packages/shared/modules/cache'
```

## Testes

A pasta `packages/shared/lib/test` contém utilitários e arquivos auxiliares destinados a facilitar a escrita e execução de testes dentro do monorepo.

O que encontrar lá:

- `test-e2e.setup.ts`: helper para criar um Nest app de teste (`createNestApp`) que inicializa contexto transacional, aplica migrations e devolve `app`, `module` e `dataSource`.
- `enum/tables.enum.ts`: enums úteis para referências de nomes de tabelas em testes.
- `index.ts`: barrel que re-exporta os helpers públicos do diretório de testes.

Boas práticas:

- Os arquivos em `packages/shared/lib/test` são helpers de teste e não devem inicializar infra de produção por conta própria.
- Importe explicitamente os helpers nos testes:

```ts
import { createNestApp } from 'packages/shared/lib/test';
```

- Se um helper precisar inicializar infra (conexões, provedores externos), considere movê-lo para `packages/shared/modules` ou documentá-lo claramente como um helper de integração.

- Evite misturar código de produção com helpers de teste no mesmo módulo/barrel para não vazar dependências para produção.

```bash
cd back
npx jest packages/shared/lib --runInBand
```

## Checklist rápido antes do PR

- Atualize `index.ts` com novos exports públicos
- Adicione `index.ts` (barrel) em novos módulos caso necessário
- Garanta que lints e testes do pacote passam
- Evite expor implementações internas desnecessárias
