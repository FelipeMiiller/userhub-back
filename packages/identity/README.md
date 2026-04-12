# Pacote `identity`

Bounded context responsável por toda a identidade do sistema: autenticação, contas, perfis e multitenancy.

## O que faz hoje

### Autenticação (`authentication/`)

Expõe `POST /auth/*` e `GET /auth/me`:

| Rota | Descrição |
|---|---|
| `POST /auth/signup` | Cria Account + Profile em transação atômica, envia e-mail de boas-vindas via RabbitMQ |
| `POST /auth/onboarding/tenant` | Cria Tenant e vincula ao account autenticado em transação atômica (etapa de onboarding) |
| `POST /auth/signin` | Login local (e-mail + senha), retorna `accessToken` (com `jti` + `tenants`) + `refreshToken` |
| `POST /auth/signout` | Invalida o refresh token e revoga o access token na denylist (Redis) |
| `POST /auth/forgot-password` | Gera senha temporária e envia e-mail de recuperação |
| `POST /auth/change-password` | Troca senha autenticada |
| `POST /auth/refreshToken` | Emite novo access token (re-busca permissões atualizadas do banco) |
| `GET /auth/google/signin` | Redireciona para OAuth Google |
| `GET /auth/google/callback` | Callback Google OAuth, cria ou encontra account (criação em transação atômica) |
| `GET /auth/me` | Retorna dados do account + perfil do token atual |
| `PATCH /auth/me` | Atualiza dados do account autenticado |

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
- `GET /tenants/:id` — busca tenant por ID
- `PATCH /tenants/:id` — atualiza nome, slug, status
- `POST /tenants/:tenantId/members` — adiciona account ao tenant
- `GET /tenants/:tenantId/members` — lista membros do tenant
- `DELETE /tenants/:tenantId/members/:accountId` — remove account do tenant
- `POST /auth/onboarding/tenant` — cria tenant e vincula ao account autenticado (onboarding)

Ver [DESIGN-AUTHORIZATION.md](./DESIGN-AUTHORIZATION.md) para o modelo completo de autorização, diagrama ER, bugs conhecidos e roadmap de implementação.

### Persistência

8 entidades TypeORM com migração `1775608136301-Migration` (schema do zero):

| Tabela | Descrição |
|---|---|
| `Accounts` | Credenciais, provider, status |
| `Profiles` | Nome, e-mail, telefone, CPF, foto |
| `Addresses` | Endereço vinculado ao profile |
| `Tenants` | Empresa/organização com slug único |
| `AccountTenants` | Membership account ↔ tenant com status e permissões extras |
| `TenantRoles` | Papel definido dentro de um tenant |
| `Permissions` | Permissão nomeada por módulo/recurso/ação |
| `TenantRolePermissions` | Mapeamento role → permission com `allowedLevel` e `mode` |

Repositórios: `AccountRepository`, `ProfileRepository`, `TenantRepository`, `AccountTenantRepository`.

`AccountRepository` expõe o método `createWithProfile(input: CreateAccountWithProfileInput): Promise<Account>` que cria Account + Profile em uma única transação de banco de dados. Usado tanto no `signUp` local quanto no callback do Google OAuth.

`AccountTenantRepository` expõe `createTenantWithOwner(input)` que cria Tenant + AccountTenant em uma única transação. As interfaces `CreateTenantWithOwnerInput` e `TenantWithMembership` são definidas e exportadas nesta camada.

### Integração

- `EmailProducer` publica mensagens no RabbitMQ (exchange `notification`): `sendWelcomeEmail`, `sendPasswordResetEmail`, `sendAccountActivationEmail`

---

## O que falta ser feito

### Alta prioridade

- [ ] **Autorização** — bugs, modelo proposto e roadmap em [DESIGN-AUTHORIZATION.md](./DESIGN-AUTHORIZATION.md)

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
