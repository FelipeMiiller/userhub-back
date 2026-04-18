# Authorization Model — Identity Module

## 1. Modelo Atual (implementado)

### Cadeia de entidades

```
Account
  └─ AccountTenant (AccountId + TenantId + TenantRoleId)
        └─ TenantRoleId → TenantRole
                          └─ TenantRolePermission (TenantRoleId + PermissionId + AllowedLevel + Mode)
                                    └─ Permission (Id, Name, ModuleId FK, ResourceId FK, Action)
                                              └─ SystemResource (ModuleId FK, Slug, Name)
                                                        └─ SystemModule (Slug, Name)
                                                                  ↑
                                                       TenantModule (Tenant habilitou?)
AccountTenantPermissions (permissões extras por AccountTenantId, Mode grant/deny)
### Diagrama ER

```

Accounts ──< AccountTenants >── Tenants
│
└── TenantRoleId ──> TenantRoles (TenantId)
│
TenantRolePermissions (PermissionId, AllowedLevel, Mode)
│
Permissions (Name, ModuleId FK, ResourceId FK, Action)
│ │
│ SystemResources (ModuleId FK, Slug, Name)
│ │
└─────────┴──> SystemModules (Slug, Name)

```

### Token de autorização (`Permission.Name`)

Formato: `{module.slug}.{resource.slug}.{action}`

```

billing.invoice.read
tenant.account.manage
identity.profile.update

````

Usado nos guards: `@Permission('billing.invoice.read')`

---

## 2. Fluxo de Autenticação e Autorização

O token JWT é emitido **em um único estágio** no login, já com todos os tenants e permissões do account.

### Login (`POST /auth/signin`)

O token retornado contém a identidade do account **mais** o mapa completo de tenants e permissões:

```json
{
  "jti": "uuid-unico-por-token",
  "sub": "uuid-do-account",
  "email": "usuario@email.com",
  "status": true,
  "tenants": {
    "tenant-uuid-1": ["billing.invoice.read", "tenant.account.manage"],
    "tenant-uuid-2": ["identity.profile.update"]
  }
}
````

O claim `tenants` é um mapa onde cada chave é um `tenantId` e o valor é a lista de todas as permission names que o account possui naquele tenant (role permissions + ExtraPermissions.grant − ExtraPermissions.deny).

### Seleção de tenant por request

Não há endpoint de seleção de tenant. O cliente informa **qual tenant está ativo** em cada request via header HTTP:

```
X-Tenant-Id: <tenantId>
```

### Verificação de permissão nos módulos

O `PermissionGuard` (em `@hub/shared-module/authorization`) faz a verificação sem consultar o banco:

```
request.headers['x-tenant-id'] → tenantId
user.tenants[tenantId] → lista de permissões
lista.includes(permissionName) ou permissionCovers(held, required) → allow/deny
```

O fast path do `PermissionGuard` usa `hasPermissionWithHierarchy()` que combina match exato e hierárquico.

Se o token não possuir o campo `tenants` (compatibilidade com tokens legados), o guard faz fallback para o `IPermissionEvaluator` que consulta o banco.

### Refresh de token (`POST /auth/refreshToken`)

Ao renovar o access token, as permissões são **re-buscadas do banco**, garantindo que mudanças de role sejam propagadas sem necessidade de novo login.

### Onboarding (`POST /auth/onboarding/tenant`)

Após o signup, o account ainda não pertence a nenhum tenant. O fluxo de onboarding é:

```
1. POST /auth/signup    → cria Account + Profile (transação atômica)
2. POST /auth/signin    → retorna accessToken
3. POST /auth/onboarding/tenant { Name, Slug }
                        → verifica se account já tem tenants (ConflictException se sim)
                        → cria Tenant + TenantRole "Admin" (com todas as permissões, AllowedLevel=ADMIN)
                        → cria AccountTenant vinculado ao role Admin
                        → retorna { tenant, membership }
```

A rota exige `Authorization: Bearer <token>` e retira o `accountId` do próprio token (`sub`). O Slug deve ser único, em lowercase e formato `kebab-case`. O account só pode criar um tenant se não possuir nenhum (primeiro tenant). Após a criação, o próximo `refreshToken` já incluirá o novo `tenantId` no claim `tenants`.

### Diagrama do fluxo

```
Client                     Identity                      Outro Módulo
  │                            │                              │
  ├─ POST /auth/signin ────────►│                              │
  │                            │ getAllTenantsPermissions()    │
  │◄─ { accessToken: { sub, tenants: { tenantId: [...] } } }  │
  │                            │                              │
  ├─ GET /billing/invoices ─────────────────────────────────► │
  │  Authorization: Bearer <token>                            │
  │  X-Tenant-Id: tenant-uuid-1                               │
  │                            │  PermissionGuard:            │
  │                            │  token.tenants[tenantId]     │
  │                            │  .includes('billing.invoice.read') ◄─┤
  │◄─ 200 OK ──────────────────────────────────────────────── │
```

### Isolamento de dados por tenant

Outros módulos usam o `X-Tenant-Id` header para garantir que queries retornem apenas dados do tenant correto:

```typescript
// Controller em qualquer módulo
@Get()
findAll(@Headers('x-tenant-id') tenantId: string) {
  return this.service.findAll(tenantId);
}
```

O double-check é: **PermissionGuard** verifica se o account tem permissão no tenant informado (via token), e o **Service** filtra os dados pelo mesmo tenantId.

---

## 3. Regra de Avaliação

### Hierarquia de níveis

Análise de permissão considera **hierarquia de ações** dentro do mesmo recurso (`module.resource.*`):

| Nível | Enum     | Actions         |
|-------|----------|------------------|
| 0     | NONE     | (desconhecida)   |
| 1     | VIEW     | `list`, `view`   |
| 2     | CREATE   | `create`         |
| 3     | UPDATE   | `update`         |
| 4     | ADMIN    | `delete`         |

Nível superior implica todos os inferiores para o mesmo recurso. Ex.: `identity.account-tenant.delete` (4) cobre `list` (1), `create` (2) e `update` (3).

A função `permissionCovers(held, required)` verifica se `held` cobre `required` comparando módulo, recurso e nível da ação. Usada tanto no **PermissionGuard** (fast path) quanto no **PermissionEvaluatorService** (fallback DB).

### `PermissionEvaluatorService.evaluate(accountId, tenantId, permissionName)` — fallback via DB:

1. Busca memberships em `AccountTenants` para `(accountId, tenantId)` via `AccountTenantRepository.findMembershipsByAccountAndTenant()`
2. Se nenhuma membership → `{ allowed: false, reason: 'no_membership' }`
3. Busca extra permissions via `AccountTenantPermissionRepository.findPermissionNamesByAccountTenants()`
4. Se alguma extra permission tem `Mode=deny` com match exato → `{ allowed: false, reason: 'extra_deny' }` _(deny explícito prevalece sobre tudo)_
5. Busca `TenantRolePermissions` do mesmo recurso (`module.resource.*`) via `TenantRolePermissionRepository.findByRolesAndResourcePrefix()`
6. Se algum row tem `Mode = 'deny'` e `permissionCovers(row, required)` → `{ allowed: false, reason: 'role_deny' }`
7. Filtra rows de `allow` que cobrem hierarquicamente (`permissionCovers`); verifica também `ExtraPermissions.grant` com hierarquia
8. Se nenhum covering row E nenhum extra grant hierárquico → `{ allowed: false, reason: 'no_permission' }`
9. Calcula `maxLevel` dos covering rows; se apenas extra grant sem role, `level = 1`
10. `PermissionService.isAllowed('allow', maxLevel)` → `{ allowed: true, effectiveLevel: maxLevel }`

`PermissionEvaluatorService.getAllTenantsPermissions(accountId)`:

- Retorna o mapa `{ [tenantId]: permissionNames[] }` de **todos** os tenants do account
- Usado no login para embutir o claim `tenants` no token JWT
- Usa `AccountTenantRepository.findMembershipsByAccount()` + queries paralelas nos repos de role e extra permissions

`PermissionEvaluatorService.getAccountPermissions(accountId, tenantId)`:

- Retorna **todas** as permissions do account em um tenant específico
- Combina: permissões dos roles com `Mode = 'allow'` + `ExtraPermissions.grant` − `ExtraPermissions.deny`
- Retorna `null` se o account não pertence ao tenant

### Estrutura do `ExtraPermissions` (jsonb)

```json
{
  "grant": ["billing.invoice.read"],
  "deny": ["tenant.account.manage"]
}
```

---

## 4. Cadeia de Guards — Três Camadas de Proteção

Toda rota tenant-scoped deve empilhar **três guards** nesta ordem:

```
@UseGuards(JwtAuthGuard)          ← 1. valida JWT, popula request.user (sem DB)
@UseGuards(TenantContextGuard)    ← 2. verifica membership no token (sem DB)
@UseGuards(PermissionGuard)       ← 3. verifica permissão específica (sem DB / fallback DB)
```

### JwtAuthGuard

Verifica assinatura e expiração do token JWT, revogação via Redis denylist, e popula `request.user` com o `Payload`. Lança `UnauthorizedException` (401) se inválido.

### TenantContextGuard

Implementado em `@hub/shared-module/authorization`. Extrai o `:tenantId` (ou `:id`) da URL e verifica se `user.tenants[tenantId]` existe no payload do token — **sem consulta ao banco**.

```
params.tenantId (ou params.id) → tenantId
user.tenants[tenantId] existe?
  ├─ SIM → passa para o próximo guard
  └─ NÃO → ForbiddenException (403) "account não é membro do tenant"
```

Regra: **um account só pode acessar dados de tenants nos quais é membro ativo**. A membership é validada pelo claim `tenants` embutido no token no momento do login — sem round-trip ao banco por request.

### PermissionGuard

Opera em dois modos após o `TenantContextGuard` já ter garantido a membership:

```
header X-Tenant-Id presente?
  └─ SIM → user.tenants[tenantId] presente no token?
        ├─ SIM → verifica array diretamente  ← sem DB
        └─ NÃO → chama IPermissionEvaluator.evaluate()  ← consulta DB (fallback legado)
  └─ NÃO → nega acesso (403)
```

O tenant ativo é sempre determinado pelo header `X-Tenant-Id`, nunca pelo token em si. Isso permite que um account com múltiplos tenants use o mesmo token em contextos diferentes sem precisar reautenticar.

---

## 5. Padrão de Controller Tenant-Scoped

Qualquer rota que acessa dados de um tenant específico deve seguir o padrão abaixo. São **três camadas** obrigatórias:

```typescript
// No nível da classe (aplicado a todas as rotas)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // 1. autentica o token
@UseGuards(TenantContextGuard) // 2. verifica membership no tenant da URL
@Controller('tenants/:tenantId/invoices')
export class InvoiceController {
  // No nível do método
  @Get()
  @Permission('billing.invoice.read')
  @UseGuards(PermissionGuard) // 3. verifica permissão específica
  findAll(
    @Param('tenantId') tenantId: string,
    // Não ler X-Tenant-Id manualmente — TenantContextGuard já garantiu o tenantId da URL
  ) {
    return this.invoiceService.findAll(tenantId);
  }
}
```

> **Regra**: o `tenantId` da URL é a fonte da verdade para filtrar dados. O `TenantContextGuard` garantiu que o account é membro daquele tenant. O `PermissionGuard` garantiu que tem a permissão. O `Service` filtra os dados pelo mesmo `tenantId`.

### Nos módulos externos (billing, CRM etc.)

Controllers em outros pacotes usam os guards do `@hub/shared-module/authorization`:

```typescript
import {
  JwtAuthGuard,
  TenantContextGuard,
  PermissionGuard,
  Permission,
} from '@hub/shared-module/authorization';
```

O `X-Tenant-Id` header continua necessário para o `PermissionGuard` (fast path via token). O `:tenantId` da URL é usado pelo `TenantContextGuard` para validar membership. Ambos devem ser consistentes — o cliente envia `X-Tenant-Id: <uuid>` igual ao `:tenantId` presente na URL.

---

## 6. Entidades

| Tabela                     | Propósito                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `SystemModules`            | Catálogo de módulos da plataforma (slug único) — gerenciado por código via `IDENTITY_MODULE_CATALOG` |
| `SystemResources`          | Recursos dentro de cada módulo (slug + ModuleId FK) — gerenciado por código                          |
| `Permissions`              | Ação sobre um recurso — Name gerado, ModuleId FK, ResourceId FK — semeado de `IdentityPermissions`   |
| `TenantRoles`              | Papel definido dentro de um tenant                                                                   |
| `TenantRolePermissions`    | Mapeamento role → permission com AllowedLevel e Mode                                                 |
| `AccountTenants`           | Membership account ↔ tenant com TenantRoleId (indexado) e status                                 |
| `TenantModules`            | Módulos habilitados por tenant (TenantId + SystemModuleId únicos)                                    |
| `AccountTenantPermissions` | Permissões extras por membership (AccountTenantId + PermissionId + Mode grant/deny)                  |
| `Profiles`                 | Nome, e-mail, telefone, `BirthDate`, foto                                                            |
| `Addresses`                | Endereço com `Latitude`/`Longitude` `numeric(9,6)` — padrão Google Maps                              |

---

## 7. Repositórios disponíveis

- `SystemModuleRepository` — `findBySlug`, `findAllActive`
- `SystemResourceRepository` — `findBySlugAndModule`, `findAllByModule`
- `PermissionRepository` — `findByName`, `findAllByModule`, `findAllByResource`
- `TenantModuleRepository` — `findAllByTenant`, `isModuleActive`, `findByTenantAndModule`
- `AccountTenantPermissionRepository` — `findByAccountTenantAndPermission`
- `AddressRepository` — `findAllByProfile`, `findByIdAndProfile`

---

## 8. CatalogModule — Catálogo Gerenciado por Código

O catálogo de módulos, recursos e permissões **não é gerenciado via CRUD**. É definido em código e sincronizado automaticamente no boot.

O `CatalogSeedService` usa `createOrRestore` do `DefaultTypeOrmRepository` para cada registro:

- Busca incluindo soft-deleted (evita violação de partial unique index)
- Restaura automaticamente registros soft-deleted
- Cria novos registros quando não existem
- Não altera registros já ativos

Todos os unique indexes das entidades usam **partial index** (`WHERE "DeletedAt" IS NULL`), permitindo reutilização de slugs/nomes após soft delete.

### Fontes de verdade (`shared/module/authorization`)

```typescript
// Módulos e recursos da plataforma
IDENTITY_MODULE_CATALOG = [
  {
    slug: 'identity',
    name: 'Identity',
    resources: [
      { slug: 'tenant', name: 'Tenant' },
      { slug: 'tenant-role', name: 'Tenant Role' },
      // ...
    ],
  },
];

// Permissões — formato: {module}.{resource}.{action}
IdentityPermissions = {
  TENANT_VIEW: 'identity.tenant.view',
  TENANT_ROLE_CREATE: 'identity.tenant-role.create',
  ADDRESS_LIST: 'identity.address.list',
  ADDRESS_VIEW: 'identity.address.view',
  ADDRESS_CREATE: 'identity.address.create',
  ADDRESS_UPDATE: 'identity.address.update',
  ADDRESS_DELETE: 'identity.address.delete',
  // ...
};
```

### `CatalogSeedService` (OnModuleInit)

No boot da aplicação, faz upsert idempotente:

1. Cria/atualiza `SystemModules` a partir de `IDENTITY_MODULE_CATALOG`
2. Cria/atualiza `SystemResources` a partir dos `resources[]` de cada módulo
3. Cria `Permissions` parseando cada valor de `IdentityPermissions` (`module.resource.action`)

**Adicionar módulo/permissão**: editar as constantes em `shared/module/authorization` → reiniciar a aplicação.

### HTTP (read-only)

| Rota                                           | Permissão             |
| ---------------------------------------------- | --------------------- |
| `GET /catalog/modules`                         | `CATALOG_MODULE_LIST` |
| `GET /catalog/modules/:id`                     | `CATALOG_MODULE_VIEW` |
| `GET /catalog/modules/:moduleId/resources`     | `CATALOG_MODULE_LIST` |
| `GET /catalog/modules/:moduleId/resources/:id` | `CATALOG_MODULE_VIEW` |

Nenhum POST/PATCH/DELETE exposto — o catálogo é imutável via API.

---

## 9. Migrations

| Migration       | Conteúdo                                                                                                                                                                                                                                                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `1776300000000` | **Migração consolidada** — schema completo do zero; substitui todas as 6 anteriores. Inclui: todas as tabelas com colunas FK como `uuid`, índices parciais, triggers de sincronização de e-mail (3 triggers), `TenantModules`, `AccountTenantPermissions`, `BirthDate` em `Profiles`, `Latitude`/`Longitude` em `Addresses` |

---

## 10. O que ainda falta

- [x] **Opção B de ExtraPermissions** — tabela `AccountTenantPermissions`; `ExtraPermissions` jsonb removido
- [x] **Seed de SystemModules/SystemResources/Permissions** — `CatalogSeedService` (OnModuleInit) via `IDENTITY_MODULE_CATALOG` + `IdentityPermissions`
- [x] **Onboarding de tenant** — `POST /auth/onboarding/tenant`
- [x] **Gerenciamento de memberships** — `POST/GET/DELETE /tenants/:id/members`
- [x] **TenantContextGuard criado e exportado**
- [x] **Aplicar TenantContextGuard nos controllers** — `TenantController`, `AccountTenantController`, `TenantRoleController`, `TenantModuleController`
- [x] **Migração consolidada** — 6 migrations fundidas em `1776300000000`
- [x] **Colunas FK como `uuid`** — corrigidas em todas as entidades
- [x] **3 triggers de e-mail** — `trg_set_profile_email_on_insert`, `trg_sync_profile_email_on_account_update`, `trg_enforce_profile_email_from_account`
- [x] **CatalogModule read-only** — sem CRUD; catálogo gerenciado por código
- [x] **`BirthDate` em Profile** — coluna `date` nullable
- [x] **`Latitude`/`Longitude` em Address** — `numeric(9,6)`, substitui `Location varchar`
- [x] **CRUD de endereços (self-service)** — `MeController`: `GET/POST/PATCH/DELETE /auth/me/addresses`; JWT apenas; `AddressService` resolve `profileId` via `accountId`
- [x] **CRUD de endereços (tenant-admin)** — `TenantMemberAddressController`: `GET/POST/PATCH/DELETE /tenants/:tenantId/members/:accountId/addresses`; verifica membership antes de qualquer operação
- [x] **`MeController` consolidado** — `GET /auth/me`, `PATCH /auth/me` e rotas de endereços movidos para `me.controller.ts`
- [x] **Testes e2e** — `auth`, `tenant`, `tenant-roles`, `system-modules` (agora `/catalog/modules`), `permission-catalog`

---

## 11. Plano: Módulos por Tenant (TenantModule) — ✅ Implementado

### Cadeia de entidades atualizada

```
Account
  └─ AccountTenant (AccountId + TenantId + TenantRoleId)
        └─ TenantRoleId → TenantRole
                              └─ TenantRolePermission → Permission → SystemModule
                                                                         ↑
                                                            TenantModule (Tenant habilitou?)
```

### Artefatos

| Arquivo                                                      | Responsabilidade                                                  | Status |
| ------------------------------------------------------------ | ----------------------------------------------------------------- | ------ |
| `persistence/entities/tenantModules.entities.ts`             | Entidade `TenantModule`                                           | ✅     |
| `persistence/repository/tenant-module.typeorm.repository.ts` | `findAllByTenant`, `isModuleActive`, `findByTenantAndModule`      | ✅     |
| `tenant/core/services/tenant-module.service.ts`              | `enableModule`, `disableModule`, `listModules`, `isModuleEnabled` | ✅     |
| `tenant/http/rest/tenant-module.controller.ts`               | `GET/POST/DELETE /tenants/:tenantId/modules`                      | ✅     |
| `tenant/http/dto/request/enable-tenant-module.dto.ts`        | `{ SystemModuleId: string }`                                      | ✅     |

### Validações implementadas

**`TenantRoleService.addPermission`** — verifica que `Permission.ModuleId` está ativo em `TenantModules` para o tenant do role (somente módulos habilitados podem receber permissões).

**`AccountTenantService.addMember`** — verifica que `TenantRole.TenantId === input.TenantId`.

### Rotas

| Método   | Rota                                   | Permissão                       |
| -------- | -------------------------------------- | ------------------------------- |
| `GET`    | `/tenants/:tenantId/modules`           | `identity.tenant-module.list`   |
| `POST`   | `/tenants/:tenantId/modules`           | `identity.tenant-module.create` |
| `DELETE` | `/tenants/:tenantId/modules/:moduleId` | `identity.tenant-module.delete` |

---

> **Regra de ouro**: um account acessa um recurso em um tenant se, e somente se,
> o seu TenantRole possuir uma `TenantRolePermission` com `Mode = allow` e
> `AllowedLevel >= nível requerido` para a `Permission` correspondente —
> exceto se houver um `deny` explícito nas `ExtraPermissions` do `AccountTenant`,
> que prevalece sobre qualquer grant de role.
> O resultado desta avaliação é embutido no token (`claim tenants`) no login
> para que qualquer módulo verifique sem consultar o banco do Identity.
