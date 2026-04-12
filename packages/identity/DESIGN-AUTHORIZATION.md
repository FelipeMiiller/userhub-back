# Authorization Model — Identity Module

## 1. Modelo Atual (implementado)

### Cadeia de entidades

```
Account
  └─ AccountTenant (AccountId + TenantId + TenantRoleId + ExtraPermissions jsonb)
        └─ TenantRoleId → TenantRole
                              └─ TenantRolePermission (TenantRoleId + PermissionId + AllowedLevel + Mode)
                                        └─ Permission (Id, Name, ModuleId FK, ResourceId FK, Action)
                                                  └─ SystemResource (ModuleId FK, Slug, Name)
                                                            └─ SystemModule (Slug, Name)
```

### Diagrama ER

```
Accounts ──< AccountTenants >── Tenants
                  │
                  └── TenantRoleId ──> TenantRoles (TenantId)
                                            │
                                   TenantRolePermissions (PermissionId, AllowedLevel, Mode)
                                            │
                                       Permissions (Name, ModuleId FK, ResourceId FK, Action)
                                            │         │
                                            │    SystemResources (ModuleId FK, Slug, Name)
                                            │         │
                                            └─────────┴──> SystemModules (Slug, Name)
```

### Token de autorização (`Permission.Name`)

Formato: `{module.slug}.{resource.slug}.{action}`

```
billing.invoice.read
tenant.account.manage
identity.profile.update
```

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
```

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
lista.includes(permissionName) → allow/deny
```

Se o token não possuir o campo `tenants` (compatibilidade com tokens legados), o guard faz fallback para o `IPermissionEvaluator` que consulta o banco.

### Refresh de token (`POST /auth/refreshToken`)

Ao renovar o access token, as permissões são **re-buscadas do banco**, garantindo que mudanças de role sejam propagadas sem necessidade de novo login.

### Onboarding (`POST /auth/onboarding/tenant`)

Após o signup, o account ainda não pertence a nenhum tenant. O fluxo de onboarding é:

```
1. POST /auth/signup    → cria Account + Profile (transação atômica)
2. POST /auth/signin    → retorna accessToken
3. POST /auth/onboarding/tenant { Name, Slug }
                        → cria Tenant + AccountTenant (transação atômica)
                        → retorna { tenant, membership }
```

A rota exige `Authorization: Bearer <token>` e retira o `accountId` do próprio token (`sub`). O Slug deve ser único, em lowercase e formato `kebab-case`. Após a criação, o próximo `refreshToken` já incluirá o novo `tenantId` no claim `tenants`.

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

`PermissionEvaluatorService.evaluate(accountId, tenantId, permissionName)` — fallback via DB:

1. Busca memberships em `AccountTenants` para `(accountId, tenantId)`
2. Se nenhuma membership → `{ allowed: false, reason: 'no_membership' }`
3. Se alguma membership tem `ExtraPermissions.deny` contendo o nome → `{ allowed: false, reason: 'extra_deny' }` *(deny explícito prevalece sobre tudo)*
4. Busca `TenantRolePermissions` para os roleIds + permissionName via JOIN em `Permissions.Name`
5. Se algum row tem `Mode = 'deny'` → `{ allowed: false, reason: 'role_deny' }`
6. Se nenhum row de role E nenhum `ExtraPermissions.grant` com o nome → `{ allowed: false, reason: 'no_permission' }`
7. Calcula `maxLevel` dos rows; se `ExtraPermissions.grant` satisfaz sem role, `level = 1`
8. `PermissionService.isAllowed('allow', maxLevel)` → `{ allowed: true, effectiveLevel: maxLevel }`

`PermissionEvaluatorService.getAllTenantsPermissions(accountId)`:

- Retorna o mapa `{ [tenantId]: permissionNames[] }` de **todos** os tenants do account
- Usado no login para embutir o claim `tenants` no token JWT
- Faz uma única query para todos os roles + ExtraPermissions em paralelo

`PermissionEvaluatorService.getAccountPermissions(accountId, tenantId)`:

- Retorna **todas** as permissions do account em um tenant específico
- Combina: permissões dos roles com `Mode = 'allow'` + `ExtraPermissions.grant` − `ExtraPermissions.deny`
- Retorna `null` se o account não pertence ao tenant

### Estrutura do `ExtraPermissions` (jsonb)

```json
{
  "grant": ["billing.invoice.read"],
  "deny":  ["tenant.account.manage"]
}
```

---

## 4. PermissionGuard — Dois Modos de Avaliação

O `PermissionGuard` em `@hub/shared-module/authorization` opera em dois modos:

```
header X-Tenant-Id presente?
  └─ SIM → user.tenants[tenantId] presente no token?
        ├─ SIM → verifica array diretamente  ← sem DB
        └─ NÃO → chama IPermissionEvaluator.evaluate()  ← consulta DB (fallback legado)
  └─ NÃO → nega acesso (403)
```

O tenant ativo é sempre determinado pelo header `X-Tenant-Id`, nunca pelo token em si. Isso permite que um account com múltiplos tenants use o mesmo token em contextos diferentes sem precisar reautenticar.

---

## 5. Verificação de Tenant nos Outros Módulos

Qualquer módulo que retorna dados multi-tenant deve verificar dois pontos:

1. **`PermissionGuard` via `X-Tenant-Id` header** — garante que o account tem permissão naquele tenant
2. **Filtro de dados pelo mesmo `X-Tenant-Id`** — garante que o service retorna só dados daquele tenant

```typescript
// Controller em qualquer módulo
@Get()
@Permission('billing.invoice.read')
@UseGuards(PermissionGuard)
findAll(@Headers('x-tenant-id') tenantId: string) {
  // tenantId já foi validado contra user.tenants no PermissionGuard
  return this.invoiceService.findAll(tenantId);
}
```

Isso garante que um account com acesso a múltiplos tenants não veja dados de um tenant que não estava no header da requisição.

---

## 6. Entidades

| Tabela | Propósito |
|--------|-----------|
| `SystemModules` | Catálogo de módulos do sistema (slug único) |
| `SystemResources` | Recursos dentro de cada módulo (slug + ModuleId FK) |
| `Permissions` | Ação sobre um recurso — Name gerado, ModuleId FK, ResourceId FK |
| `TenantRoles` | Papel definido dentro de um tenant |
| `TenantRolePermissions` | Mapeamento role → permission com AllowedLevel e Mode |
| `AccountTenants` | Membership account ↔ tenant com TenantRoleId e ExtraPermissions |

---

## 7. Repositórios disponíveis

- `SystemModuleRepository` — `findBySlug`, `findAllActive`
- `SystemResourceRepository` — `findBySlugAndModule`, `findAllByModule`

---

## 8. Migrations

| Migration | Conteúdo |
|-----------|----------|
| `1775608136301` | Schema inicial completo |
| `1775676224289` | Cria `SystemModules`, `SystemResources`; substitui `Module`/`Resource` strings em `Permissions` por FKs `ModuleId`/`ResourceId`; remove `LastLoginAt` de `Accounts` |

---

## 9. O que ainda falta

- [ ] **Opção B de ExtraPermissions** — tabela `AccountTenantPermission` para auditoria completa (decisão atual: manter jsonb)
- [x] **Seed inicial de SystemModules/SystemResources/Permissions** — executado; scripts em `persistence/seed-system-modules.ts` e `persistence/run-seed.ts`
- [x] **Onboarding de tenant** — `POST /auth/onboarding/tenant` cria Tenant + AccountTenant em transação atômica
- [x] **Gerenciamento de memberships** — `POST/GET/DELETE /tenants/:id/members`
- [x] **CRUD Tenant** — `GET/PATCH /tenants/:id` implementados
- [x] **Controller de Profile** — `GET /profiles/me`, `GET/PATCH /profiles/:id` implementados
- [x] **Testes e2e dos novos controllers** — 4 suites: `auth.e2e-spec` (signup/signin/refresh/logout), `auth-email-verification` (verify-email/resend), `tenant` (onboarding/CRUD/members/roles), `profile` (me/id/update). 58 testes passando.

---

> **Regra de ouro**: um account acessa um recurso em um tenant se, e somente se,
> o seu TenantRole possuir uma `TenantRolePermission` com `Mode = allow` e
> `AllowedLevel >= nível requerido` para a `Permission` correspondente —
> exceto se houver um `deny` explícito nas `ExtraPermissions` do `AccountTenant`,
> que prevalece sobre qualquer grant de role.
> O resultado desta avaliação é embutido no token (`claim tenants`) no login
> para que qualquer módulo verifique sem consultar o banco do Identity.

