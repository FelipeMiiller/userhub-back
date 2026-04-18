# Pacote `identity`

Bounded context responsável por toda a identidade do sistema: autenticação, contas, perfis e multitenancy.

## O que faz hoje

### Autenticação (`authentication/`)

Controllers:

- **`AuthentificationController`** — opera sobre `POST /auth/*` (signup, signin, tokens, senha, verificação de e-mail)
- **`MeController`** — centraliza todas as rotas `/auth/me*` (perfil + endereços)

#### `AuthentificationController`

| Rota                             | Descrição                                                                                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| `POST /auth/signup`              | Cria Account + Profile em transação atômica, envia e-mail de boas-vindas via RabbitMQ        |
| `POST /auth/onboarding/tenant`   | Cria Tenant e vincula ao account autenticado (ConflictException se já tem tenant); cria role Admin com todas as permissões |
| `POST /auth/signin`              | Login local (e-mail + senha), retorna `accessToken` (com `jti` + `tenants`) + `refreshToken` |
| `POST /auth/signout`             | Invalida o refresh token e revoga o access token na denylist (Redis)                         |
| `POST /auth/forgot-password`     | Gera senha temporária e envia e-mail de recuperação                                          |
| `POST /auth/change-password`     | Troca senha autenticada                                                                      |
| `POST /auth/refreshToken`        | Emite novo access token (re-busca permissões atualizadas do banco)                           |
| `GET /auth/google/signin`        | Redireciona para OAuth Google                                                                |
| `GET /auth/google/callback`      | Callback Google OAuth, cria ou encontra account (criação em transação atômica)               |
| `GET /auth/verify-email`         | Confirma e-mail via token                                                                    |
| `POST /auth/resend-verification` | Reenvia e-mail de verificação                                                                |

#### `MeController` (JWT obrigatório)

| Rota                            | Descrição                                        |
| ------------------------------- | ------------------------------------------------ |
| `GET /auth/me`                  | Retorna dados do account + perfil do token atual |
| `PATCH /auth/me`                | Atualiza dados do account autenticado            |
| `GET /auth/me/addresses`        | Lista endereços do account autenticado           |
| `GET /auth/me/addresses/:id`    | Busca um endereço pelo ID                        |
| `POST /auth/me/addresses`       | Cria um novo endereço                            |
| `PATCH /auth/me/addresses/:id`  | Atualiza um endereço                             |
| `DELETE /auth/me/addresses/:id` | Remove um endereço                               |

Estratégias implementadas: `LocalStrategy`, `JwtStrategy`, `RefreshStrategy`, `GoogleAuthUserStrategy`.

**`AccountService`** — bridge centralizado para os repositórios de Account, Profile e AccountTenant, injetado em `AuthenticationService` e utilizado pelo `AuthentificationController`:

- `create` / `createWithProfile` — cria account (com ou sem profile em transação atômica)
- `findMe` — projeção composta (account + profile + tenants) para o endpoint `/auth/me`
- `updateMe` — atualiza campos do profile pelo `accountId`
- `updateEmailVerified` — marca e-mail como verificado
- `updateProfile` — atualiza campos do profile por `profileId`
- `updatePassword` — hash + persiste nova senha
- `updateRefreshToken` — persiste/limpa hash do refresh token
- `findOneById` / `findOneByEmail` — lookups de account
- `resetPassword` — redefine senha com hash
- `findProfileByAccountId` — busca profile pelo `accountId`
- `createOnboardingTenant` — delega ao `AccountTenantService.createTenantWithOwner`

### Tenants (`tenant/`)

`TenantService`: `findOneById`, `findOneBySlug`, `create`, `update`

Controllers HTTP expostos:

| Rota                                                         | Descrição                                    | Guards                                |
| ------------------------------------------------------------ | -------------------------------------------- | ------------------------------------- |
| `GET /tenants/:id`                                           | Busca tenant por ID                          | JWT + PermissionGuard                 |
| `PATCH /tenants/:id`                                         | Atualiza nome, slug, status                  | JWT + PermissionGuard                 |
| `GET /tenants/:tenantId/members`                             | Lista membros do tenant                      | JWT + PermissionGuard                 |
| `POST /tenants/:tenantId/members`                            | Adiciona account ao tenant                   | JWT + PermissionGuard                 |
| `DELETE /tenants/:tenantId/members/:accountId`               | Remove account do tenant                     | JWT + PermissionGuard                 |
| `GET /tenants/:tenantId/roles`                               | Lista roles de um tenant                     | JWT + PermissionGuard                 |
| `GET /tenants/:tenantId/roles/:id`                           | Busca role por ID                            | JWT + PermissionGuard                 |
| `POST /tenants/:tenantId/roles`                              | Cria role para o tenant                      | JWT + PermissionGuard                 |
| `PATCH /tenants/:tenantId/roles/:id`                         | Atualiza role                                | JWT + PermissionGuard                 |
| `DELETE /tenants/:tenantId/roles/:id`                        | Exclui role                                  | JWT + PermissionGuard                 |
| `GET /tenants/:tenantId/roles/:id/permissions`               | Lista permissões da role                     | JWT + PermissionGuard                 |
| `POST /tenants/:tenantId/roles/:id/permissions`              | Adiciona permissão à role                    | JWT + PermissionGuard                 |
| `DELETE /tenants/:tenantId/roles/:roleId/permissions/:id`    | Remove permissão da role                     | JWT + PermissionGuard                 |
| `GET /tenants/:tenantId/modules`                             | Lista módulos habilitados pelo tenant        | JWT + TenantContext + PermissionGuard |
| `POST /tenants/:tenantId/modules`                            | Habilita módulo para o tenant                | JWT + TenantContext + PermissionGuard |
| `DELETE /tenants/:tenantId/modules/:moduleId`                | Desabilita módulo do tenant                  | JWT + TenantContext + PermissionGuard |
| `GET /tenants/:tenantId/members/:accountId/addresses`        | Lista endereços de um membro                 | JWT + TenantContext + PermissionGuard |
| `GET /tenants/:tenantId/members/:accountId/addresses/:id`    | Busca endereço de um membro                  | JWT + TenantContext + PermissionGuard |
| `POST /tenants/:tenantId/members/:accountId/addresses`       | Cria endereço para um membro                 | JWT + TenantContext + PermissionGuard |
| `PATCH /tenants/:tenantId/members/:accountId/addresses/:id`  | Atualiza endereço de um membro               | JWT + TenantContext + PermissionGuard |
| `DELETE /tenants/:tenantId/members/:accountId/addresses/:id` | Remove endereço de um membro                 | JWT + TenantContext + PermissionGuard |
| `GET /catalog/modules`                                       | Lista módulos da plataforma (read-only)      | JWT + PermissionGuard                 |
| `GET /catalog/modules/:id`                                   | Detalhe de um módulo da plataforma           | JWT + PermissionGuard                 |
| `GET /catalog/modules/:moduleId/resources`                   | Lista recursos de um módulo                  | JWT + PermissionGuard                 |
| `GET /catalog/modules/:moduleId/resources/:id`               | Detalhe de um recurso                        | JWT + PermissionGuard                 |
| `GET /permissions`                                           | Lista catálogo de permissões                 | JWT + PermissionGuard                 |
| `POST /permissions`                                          | Cria permissão (Name gerado)                 | JWT + PermissionGuard                 |
| `POST /auth/onboarding/tenant`                               | Cria tenant e vincula ao account autenticado | JWT                                   |

> **Isolamento por tenant**: todas as rotas com `:tenantId` devem usar `TenantContextGuard` (pendente — ver roadmap abaixo). O guard valida, via token, que o account é membro do tenant antes de qualquer operação.

Ver [DESIGN-AUTHORIZATION.md](./DESIGN-AUTHORIZATION.md) para o modelo completo de autorização, cadeia de guards, diagrama ER e roadmap.

### Catalog (`catalog/`)

Submódulo responsável pelo catálogo global de módulos e recursos da plataforma.

**Fonte de verdade única** em `shared/module/authorization`:

- `IDENTITY_MODULE_CATALOG` — define módulos e recursos disponíveis na plataforma
- `IdentityPermissions` — define todas as permissões no formato `{module}.{resource}.{action}`

**`CatalogSeedService`** (`OnModuleInit`) — no boot da aplicação faz upsert automático e idempotente de:

- `SystemModules` a partir de `IDENTITY_MODULE_CATALOG`
- `SystemResources` a partir de `resources[]` por módulo
- `Permissions` parseando `IdentityPermissions`

Usa o método `createOrRestore` do `DefaultTypeOrmRepository`: busca incluindo soft-deleted → restaura se encontrar deletado → cria se não existir → retorna se já ativo. Isso garante idempotência mesmo com registros soft-deleted que manteriam o slot no índice único.

**Para adicionar um novo módulo**: basta adicionar entrada em `IDENTITY_MODULE_CATALOG` e permissões em `IdentityPermissions`. O seed cuida do resto no próximo boot — sem CRUD manual.

Controllers expostos (somente leitura):

| Rota                                           | Descrição                               |
| ---------------------------------------------- | --------------------------------------- |
| `GET /catalog/modules`                         | Lista módulos disponíveis na plataforma |
| `GET /catalog/modules/:id`                     | Detalhe de um módulo                    |
| `GET /catalog/modules/:moduleId/resources`     | Lista recursos de um módulo             |
| `GET /catalog/modules/:moduleId/resources/:id` | Detalhe de um recurso                   |

### Persistência

12 entidades TypeORM — migração consolidada `1776300000000-Migration` (schema completo do zero):

| Tabela                     | Descrição                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| `Accounts`                 | Credenciais, provider, status                                                            |
| `Profiles`                 | Nome, e-mail, telefone, data de nascimento, foto                                         |
| `Addresses`                | Endereço vinculado ao profile com coordenadas (`Latitude`, `Longitude` — `numeric(9,6)`) |
| `Tenants`                  | Empresa/organização com slug único                                                       |
| `AccountTenants`           | Membership account ↔ tenant com TenantRoleId e status                                    |
| `TenantRoles`              | Papel definido dentro de um tenant                                                       |
| `Permissions`              | Permissão nomeada por módulo/recurso/ação (`ModuleId`, `ResourceId` FKs)                 |
| `TenantRolePermissions`    | Mapeamento role → permission com `allowedLevel` e `mode`                                 |
| `SystemModules`            | Catálogo de módulos da plataforma (slug único)                                           |
| `SystemResources`          | Recursos dentro de cada módulo (slug + `ModuleId` FK)                                    |
| `TenantModules`            | Módulos habilitados por tenant (`TenantId` + `SystemModuleId` únicos)                    |
| `AccountTenantPermissions` | Permissões extras por membership — substitui `ExtraPermissions` jsonb                    |

#### Estratégia de indexação

Todos os unique indexes usam **partial index** com `WHERE "DeletedAt" IS NULL`, permitindo reutilização de slugs/emails após soft delete sem violação de constraint:

| Tabela          | Coluna  | Tipo                                     |
| --------------- | ------- | ---------------------------------------- |
| `Accounts`      | `Email` | `UNIQUE WHERE "DeletedAt" IS NULL`      |
| `Tenants`       | `Slug`  | `UNIQUE WHERE "DeletedAt" IS NULL`      |
| `Permissions`   | `Name`  | `UNIQUE WHERE "DeletedAt" IS NULL`      |
| `SystemModules` | `Slug`  | `UNIQUE WHERE "DeletedAt" IS NULL`      |

Índices de FK para performance de JOINs:

| Tabela                     | Coluna(s)                               | Contexto                                                          |
| -------------------------- | --------------------------------------- | ----------------------------------------------------------------- |
| `AccountTenants`           | `AccountId`, `TenantId`, `TenantRoleId` | `TenantRoleId` é chave de JOIN na query `findMeById` (7 tabelas) |
| `TenantRolePermissions`    | `TenantRoleId`, `PermissionId`         | JOIN em avaliação de permissões                    |
| `Permissions`              | `ModuleId`, `ResourceId`               | FK + filtros por módulo/recurso                    |
| `SystemResources`          | `ModuleId`, `Slug`                     | FK + lookup por slug                               |
| `TenantModules`            | `TenantId`, `SystemModuleId`           | Verificação de módulo ativo                        |

Repositórios: `AccountRepository`, `ProfileRepository`, `AddressRepository`, `TenantRepository`, `AccountTenantRepository`, `AccountTenantPermissionRepository`, `TenantRolePermissionRepository`.

`DefaultTypeOrmRepository` (base class em `@hub/shared-module/persistences`) expõe:

- `create` / `update` / `softDelete` / `restore` — operações CRUD padrão
- `findOne` / `findMany` — queries filtradas por soft delete automaticamente
- `findOneWithDeleted` / `findManyWithDeleted` — queries que incluem registros soft-deleted
- `createOrRestore(where, entity)` — busca incluindo soft-deleted; restaura se deletado, cria se não existe, retorna se já ativo. Usado no seed e em qualquer cenário de upsert idempotente com soft delete.

`AccountRepository` expõe o método `createWithProfile(input: CreateAccountWithProfileInput): Promise<Account>` que cria Account + Profile em uma única transação de banco de dados. Usado tanto no `signUp` local quanto no callback do Google OAuth.

`AccountTenantRepository` expõe `createTenantWithOwner(input)` que cria Tenant + TenantRole "Admin" (com todas as permissões, `AllowedLevel=ADMIN`) + AccountTenant em uma única transação. O account só pode criar um tenant se não possuir nenhum (verificado no service com `ConflictException`). As interfaces `CreateTenantWithOwnerInput` e `TenantWithMembership` são definidas e exportadas nesta camada.

Repositórios também expõem métodos de consulta usados pelo `PermissionEvaluatorService`:

- `AccountTenantRepository`: `findMembershipsByAccountAndTenant()`, `findMembershipsByAccount()`
- `AccountTenantPermissionRepository`: `findPermissionNamesByAccountTenants()`
- `TenantRolePermissionRepository`: `findAllowedPermissionNamesByRoles()`, `findByRolesAndResourcePrefix()`

### Integração

- `EmailProducer` publica mensagens no RabbitMQ (exchange `notification`): `sendWelcomeEmail`, `sendPasswordResetEmail`, `sendAccountActivationEmail`

---

## O que falta ser feito

### Alta prioridade

- [x] ~~**Aplicar `TenantContextGuard` nos controllers**~~ — aplicado em todos os controllers tenant-scoped
- [x] ~~**Exportar `TenantContextGuard`**~~ — exportado em `shared/module/authorization/index.ts`
- [x] ~~**Migração consolidada**~~ — 6 migrations incrementais fundidas em `1776300000000-Migration` (schema completo)
- [x] ~~**Colunas FK tipadas como `uuid`**~~ — `AccountId`, `TenantId`, `TenantRoleId`, `PermissionId`, `ProfileId` corrigidos
- [x] ~~**`CatalogModule` com seed automático**~~ — `CatalogSeedService` faz upsert de módulos/recursos/permissões no boot

### Média prioridade

- [x] ~~**TenantModule — Módulos por Tenant**~~ — entidade, repository, service e controller criados
- [x] ~~**Validação cross-tenant em `TenantRoleService.addPermission`**~~ — `Permission.ModuleId` validado via `TenantModuleRepository.isModuleActive`
- [x] ~~**Validação em `AccountTenantService.addMember`**~~ — `TenantRole.TenantId === input.TenantId` verificado
- [x] ~~**`IDENTITY_MODULE_CATALOG` + `IdentityPermissions` como única fonte de verdade**~~ — módulos/recursos/permissões definidos em código; seed idempotente
- [x] ~~**`BirthDate` em `Profile`**~~ — coluna `date` nullable
- [x] ~~**`Latitude`/`Longitude` em `Address`**~~ — substituiu `Location varchar`; `numeric(9,6)` — padrão Google Maps
- [x] ~~**CRUD de endereços (self-service)**~~ — `MeController`: `GET/POST/PATCH/DELETE /auth/me/addresses`
- [x] ~~**CRUD de endereços (tenant-admin)**~~ — `TenantMemberAddressController`: `GET/POST/PATCH/DELETE /tenants/:tenantId/members/:accountId/addresses`
- [x] ~~**`MeController` consolidado**~~ — `GET /auth/me`, `PATCH /auth/me` e rotas de endereços num único controller

### Baixa prioridade

- [x] ~~**Testes e2e para `GET/POST/DELETE /tenants/:tenantId/modules`**~~ — cobertos em `tenant.spec.ts`
- [x] ~~**Testes e2e para role permissions**~~ — cobertos em `tenant.spec.ts`
- [x] ~~**Testes e2e para `GET/PATCH/DELETE /tenants/:tenantId/roles/:id`**~~ — cobertos em `tenant-roles.spec.ts`
- [x] ~~**Testes e2e para `/catalog/modules` e recursos**~~ — cobertos em `system-modules.spec.ts`
- [x] ~~**Testes e2e para `GET/POST/DELETE /permissions`**~~ — cobertos em `permission-catalog.spec.ts`
- [x] ~~**Factory `tenant-module.test-factory.ts`**~~ — criada em `__tests__/factory/`

---

## Comandos

```bash
# Build
nx build identity

# Lint
nx lint:check identity

# Gerar nova migration (após alterar entidades)
nx db:generate identity

# Rodar migrations
nx db:migrate identity

# Testes e2e
yarn test:e2e identity
```

## Política de identidade

- Sistema multi-tenant; **Tenant = Empresa**
- Accounts são globais; papéis e permissões são **sempre** escopados por `tenantId`
- Toda query sensível exige `(accountId, tenantId)` — queries sem `tenantId` são proibidas
- Não logar PII (LGPD)

## Checklist antes de PR

Isolamento de estado, testes, lint, ausência de dependências circulares.
