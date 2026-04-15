<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# UserHub Backend — API NestJS

## 🧩 Arquitetura Modular — Visão Geral

Este projeto adota uma **arquitetura modular** baseada em princípios explícitos de boundaries, isolamento de domínios e evolução incremental, voltados para escalabilidade, facilidade de manutenção e crescimento sustentável.

### Estrutura Modular

- **Apps (`/apps`)**: Pontos de entrada (bootstraps) que apenas orquestram módulos, sem conter lógica de negócio. Exemplos: `monolith`, `notification`.
- **Packages (`/packages`)**: Cada domínio de negócio (ex: identidade, notificações) é isolado em seu próprio pacote, contendo regras, entidades, controllers, config e testes.
- **Shared (`/shared`)**: Módulos utilitários e infraestrutura compartilhada (ex: autenticação, cache, fila, loggers).

### Princípios Aplicados

- **Boundaries bem definidos**: Cada módulo expõe apenas suas interfaces públicas (ex: via `index.ts`), nunca entidades internas ou implementações privadas.
- **Independência**: Módulos podem ser desenvolvidos, testados e implantados de forma isolada. Comunicação entre módulos acontece por contratos bem definidos (interfaces, DTOs, eventos).
- **Composabilidade**: Apps podem combinar diferentes módulos/packages facilmente. Exemplo: o app `monolith` importa `ContentModule`, `IdentityModule` e outros conforme necessário.
- **Plugabilidade**: Adicionar ou remover domínios é simples — basta importar/remover o package no app correspondente.
- **Testabilidade**: Cada módulo possui seus próprios testes e pode ser testado isoladamente.

#### Exemplo de independência

- O módulo `authorization` em `shared/modules/authorization` exporta apenas seu módulo, serviços, guards, enums e decorators públicos, mantendo entidades e lógica interna encapsuladas.
- Cada módulo pode ser testado e configurado sem dependências diretas de outros domínios.

#### Exemplo de plugabilidade

- Para adicionar um novo domínio, basta criar um novo package e importar no app desejado.
- Para evoluir para microserviços, extraia o package para um serviço dedicado sem reescrita de lógica.

### Vantagens

- **Isolamento**: Cada domínio evolui independente.
- **Escalabilidade**: Fácil crescer para múltiplos apps/microserviços.
- **Organização**: Código limpo, desacoplado e sustentável.
- **Reuso**: Packages podem ser publicados e reutilizados em outros projetos.

---

### 🆕 Mudanças Recentes na Arquitetura

- Refatoração dos boundaries dos módulos para garantir que apenas facades e interfaces públicas sejam exportadas.
- Padronização dos `index.ts` de packages/shared para evitar exposição de entidades e implementações internas.
- Validação de compliance com o guideline modular: apps apenas orquestram, packages concentram a lógica, e shared fornece infraestrutura reutilizável.
- Revisão dos providers e DI para garantir baixo acoplamento e facilitar testes.
- Documentação aprimorada dos contratos de comunicação entre módulos.

---

API construída com **NestJS + TypeScript**, autenticação JWT, multitenancy, controle de permissões, Swagger, logging estruturado, RabbitMQ e arquitetura modular.

## 📁 Estrutura de Pastas

```
├── apps/
│   ├── identity/          # Bootstrap do app identity (orquestra IdentityModule)
│   └── notification/      # Bootstrap do app notification
│
├── packages/
│   ├── identity/          # Domínio de identidade — auth, tenants, catalog, persistência
│   │   ├── authentication/
│   │   ├── tenant/
│   │   ├── catalog/
│   │   ├── persistence/
│   │   └── config/
│   └── notification/      # Domínio de notificações (e-mail, push)
│
├── shared/
│   ├── lib/               # Utilitários e bibliotecas reutilizáveis (não-módulo)
│   └── module/            # Módulos de infraestrutura compartilhada
│       ├── authorization/ # Guards JWT, PermissionGuard, TokenDenylist
│       ├── cache/         # Redis cache
│       ├── event/         # Eventos internos
│       ├── http-client/   # Cliente HTTP configurável
│       ├── integrations/  # RabbitMQ e integrações externas
│       ├── loggers/       # Logger estruturado
│       └── persistences/  # TypeORM base
│
├── docker/
│   └── dev.docker-compose.yml  # PostgreSQL + Redis + RabbitMQ local
│
└── .env.example           # Template de variáveis de ambiente
```

## 🚀 Como iniciar a aplicação

### 1. Pré-requisitos

- Node.js >= 24.13.0
- Yarn
- Docker + Docker Compose

### 2. Variáveis de ambiente

Copie o exemplo e preencha as variáveis:

```bash
cp .env.example .env
```

Variáveis obrigatórias por serviço:

| Grupo      | Variáveis                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------- |
| App        | `PORT`, `NODE_ENV`, `BACKEND_DOMAIN`                                                         |
| JWT        | `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_JWT_SECRET`, `REFRESH_JWT_EXPIRES_IN`               |
| PostgreSQL | `TYPEORM_HOST`, `TYPEORM_USERNAME`, `TYPEORM_PASSWORD`, `TYPEORM_DATABASE`, `TYPEORM_PORT`   |
| Redis      | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_TTL`                                    |
| RabbitMQ   | `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD`, `RABBITMQ_VHOST` |
| Google     | `GOOGLE_CLIENT_ID`, `GOOGLE_SECRET`, `GOOGLE_CALLBACK_USER_PATH`                             |
| Identity   | `IDENTITY_API_PORT` (padrão: `PORT`)                                                         |

### 3. Subir infraestrutura local

```bash
docker compose -f docker/dev.docker-compose.yml --project-name userhub up -d
```

Isso sobe PostgreSQL, Redis e RabbitMQ.

### 4. Rodar migrations

```bash
# Migrations do domínio identity
yarn db:migrate:identity
```

### 5. Iniciar apps em desenvolvimento

Cada app é um processo independente. Inicie os que precisar:

```bash
# App identity (porta definida em IDENTITY_API_PORT ou PORT)
yarn start:dev:identity

# App notification
yarn start:dev:notification
```

Ou via Nx diretamente:

```bash
npx nx run identity-app:serve
npx nx run notification-app:serve
```

### 6. Build de produção

```bash
yarn build:identity
yarn build:notification

# Ou todos de uma vez
yarn build
```

---

## 📦 Módulos — Documentação

| Módulo                     | Caminho                        | README                                                                                 |
| -------------------------- | ------------------------------ | -------------------------------------------------------------------------------------- |
| **identity** (domínio)     | `packages/identity/`           | [packages/identity/README.md](packages/identity/README.md)                             |
| **notification** (domínio) | `packages/notification/`       | [packages/notification/README.md](packages/notification/README.md)                     |
| **shared/lib**             | `shared/lib/`                  | [shared/lib/README.md](shared/lib/README.md)                                           |
| **shared/module**          | `shared/module/`               | [shared/module/README.md](shared/module/README.md)                                     |
| **authorization**          | `shared/module/authorization/` | [shared/module/authorization/README.md](shared/module/authorization/README.md)         |


---

## ⚙️ Scripts Disponíveis

```bash
# Desenvolvimento
yarn start:dev:identity       # inicia o app identity com watch
yarn start:dev:notification   # inicia o app notification com watch

# Build
yarn build:identity
yarn build:notification
yarn build                    # todos os projetos

# Banco de dados
yarn db:migrate:identity      # roda migrations do identity
yarn db:generate:identity     # gera nova migration após alterar entidades
yarn db:drop:identity         # dropa o schema (cuidado!)

# Lint / Format
yarn lint
yarn format

# Testes
yarn test:identity            # testes do pacote identity
yarn test:notification        # testes do pacote notification
yarn test                     # todos os projetos

# Cobertura
yarn test:cov
```

### Instalar dependências em pacotes específicos

```bash
# No workspace root (use -W)
yarn add <pacote> -W

# Em um package específico
yarn workspace @packages/identity add <pacote>
yarn workspace @packages/notification add <pacote>
```
