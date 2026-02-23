# Packages — Delimitações e Responsabilidades

Este documento descreve regras simples para decidir onde colocar código dentro da pasta `packages` do monorepo, e as diferenças práticas entre `shared/lib` e `shared/modules`.

1) Objetivo das pastas

- `packages/shared/lib`: código utilitário, puro e sem inicialização de infra.
  - Exemplos: DTOs, interceptors, pipes, helpers, tipos, funções puras e utilitários reutilizáveis.
  - Não deve abrir conexões, executar migrations nem registrar providers que inicializem infraestrutura.
  - Deve exportar símbolos via `index.ts` (barrel) para consumo fácil: `import { X } from 'packages/shared/lib'`.

- `packages/shared/modules`: módulos de infraestrutura/integrations que registram providers.
  - Exemplos: Redis, TypeORM, Mail, Loggers, Authorization, HTTP clients com providers.
  - Podem usar `@Global()` quando apropriado, mas prefira exportar providers explicitamente.
  - Cada módulo deve ter seu próprio `index.ts` (barrel) e ser importado diretamente: `import { LoggerModule } from 'packages/shared/modules/loggers'`.

2) Regras práticas

- Se o código precisa inicializar uma dependência ou abrir uma conexão → vai em `modules`.
- Se o código for stateless, reutilizável e sem efeito colateral → vai em `lib`.
- `lib` pode depender de `lib` (outros utilitários), mas não de `modules` que inicializam infra.
- `modules` pode depender de `lib` para obter utilitários e tipos.
- Nunca re-exporte módulos de `packages/shared/modules` a partir do `packages/shared/lib/index.ts`.

3) Organização e exports

- Cada pacote deve expor claramente seus símbolos públicos via `index.ts` (barrel).
- Evite exports por side-effects e mantenha o `index.ts` enxuto (apenas símbolos públicos).

4) Testes e isolamento

- Testes unitários para `lib` e testes de integração para `modules` que inicializam infra.
- Siga as regras de `STATE-ISOLATION.md` quando trabalhar com entidades/migrations/DB.

5) Checklist rápido ao criar algo novo

- É utilitário puro? → `packages/shared/lib`.
- Precisa registrar providers/conexões? → `packages/shared/modules`.
- Adicione `index.ts` se expor símbolos públicos.
- Atualize docs/README do pacote correspondente.

Seguindo essas regras você mantém fronteiras claras, facilita testes e evita vazamento de estado entre apps.

## Leituras relacionadas

- `packages/shared/lib/README.md`: como criar bibliotecas `lib` (boas práticas, barrels, testes).
- `packages/shared/modules/README.md`: como criar módulos de infraestrutura (`modules`) e exemplos práticos.

Este documento é o ponto central (delimitações). Consulte os READMEs específicos de cada pasta para guias passo-a-passo e exemplos.
