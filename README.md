<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# UserHub Backend — API NestJS



API  construída com **NestJS + TypeScript**, autenticação JWT, controle de usuários, permissões, documentação Swagger, logging estruturado ( Slack), CI/CD Render, e arquitetura modular profissional.

## ⚡ Funcionalidades 

### 1. Autenticação de Usuários
- Rotas:
  - `POST /auth/register` — Cadastro
  - `POST /auth/login` — Login
- JWT para autenticação
- (Opcional) OAuth Google/Microsoft

### 2. Gerenciamento e CRUD de Usuários
- Rotas:
  - `GET /users` — Listar usuários (admin)
  - `GET /users/me` — Ver perfil próprio
  - `PATCH /users/:id` — Atualizar
  - `DELETE /users/:id` — Excluir
- Campos: `id` (ULID), `name`, `email` (único), `password` (hash), `role` (`admin`/`user`), `createdAt`, `updatedAt`
- Permissões:
  - **admin**: listar e excluir todos
  - **user**: editar/visualizar apenas o próprio perfil

### 3. Filtros e Ordenação
- Filtro por role: `?role=admin`
- Ordenação: `?sortBy=name&order=asc`

### 4. Notificações de Inativos
- Endpoint para listar usuários sem login há 30 dias

### 5. Logging Estruturado e Auditoria
- Logs em console,  Slack
- Logger configurável: persistência e alerta por Slack
- Exemplo:
```typescript
logger.error('Falha ao salvar usuário', { payload }, { auditable: true, slack: true, userId });
```

### 6. Documentação, Testes e Deploy
- Swagger em `/api/docs`
- Testes com Jest (`yarn test`)
- Docker Compose para ambiente local (Postgres, Mongo, Redis)
- Deploy automatizado com Render (CI/CD)

## 🔐 Segurança
- JWT, roles, validação, tratamento de erros

## 🛠️ Variáveis de Ambiente
- `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `SLACK_WEBHOOK_URL`, etc.

---



O projeto utiliza **ULID** (Universally Unique Lexicographically Sortable Identifier) como identificador único para entidades principais, em substituição ao UUID tradicional. ULIDs são ordenáveis por tempo, seguros para uso distribuído e facilitam queries e ordenação no banco de dados.

**Vantagens do ULID:**
- Ordenação temporal nativa
- Compatível com bancos modernos
- Mais amigável para logs e URLs do que UUID

**Exemplo de uso:**
```typescript
import { ulid } from 'ulid';

const newId = ulid(); // Exemplo: 01HZ7YF8T1X3J6Y2YB4K2K3QZC
```

As migrations e entidades já estão preparadas para trabalhar com ULID como chave primária.


## 📁 Estrutura de Pastas

```
src/
├── modules/        # Módulos de domínio (auth, users, etc.)
│   ├── auth/       # Autenticação e autorização
│   └── users/      # Gerenciamento de usuários
├── common/         # Utilitários, decorators, filtros globais
│   ├── decorators/ # Decorators personalizados
│   ├── filters/    # Filtros de exceção
│   ├── guards/     # Guards de autenticação
│   ├── interceptors/ # Interceptors
│   └── shared/     # Código compartilhado
├── config/         # Configurações centralizadas
├── migrations/     # Migrations do banco de dados
└── main.ts         # Bootstrap da aplicação

test/               # Testes unitários e e2e
```

## ⚙️ Scripts Disponíveis

```bash
# Iniciar em modo desenvolvimento
yarn start:dev

# Build de produção
yarn build

# Iniciar em produção
yarn start:prod

# Lint
yarn lint

# Format
yarn format

# Testes unitários
yarn test

# Testes e2e
yarn test:e2e

# Cobertura de testes
yarn test:cov
```

