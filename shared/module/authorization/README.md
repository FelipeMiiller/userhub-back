# `@hub/shared-module/authorization`

Módulo global de autorização compartilhado entre todos os pacotes do monorepo.

Responsabilidades:
- Verificação e revogação de tokens JWT
- Guards globais de autenticação e permissão
- Contrato de permissões entre módulos

---

## O que este módulo fornece

| Export | Tipo | Descrição |
|--------|------|-----------|
| `AuthorizationModule` | `@Global()` | Importar uma vez no app raiz |
| `AuthorizationService` | Service | Verifica e revoga tokens JWT |
| `TokenDenylistService` | Service | Persiste tokens revogados no Redis |
| `JwtAuthGuard` | Guard | Aplicado globalmente via `APP_GUARD` |
| `RolesGuard` | Guard | ⚠️ Legado — sem uso ativo; use `@Permission()` + `PermissionGuard` |
| `PermissionGuard` | Guard | Usar com `@Permission()` nos controllers |
| `@Public()` | Decorator | Marca rota como pública (isenta do `JwtAuthGuard`) |
| `@Permission(name)` | Decorator | Declara permissão requerida pela rota |
| `@RolesGuards(roles)` | Decorator | ⚠️ Legado — sem uso ativo |
| `IPermissionEvaluator` | Interface | Implementar para fornecer avaliação via DB |
| `PERMISSION_EVALUATOR` | Token | Token de injeção para `IPermissionEvaluator` |
| `Payload` | Interface | Tipo do payload JWT |
| `PermissionLevel` | Enum | Níveis de permissão: NONE, VIEW, EDIT, ADMIN |

---

## Configuração inicial (app raiz)

O `AuthorizationModule` é `@Global()` e deve ser importado uma única vez no módulo raiz da aplicação. Ele registra automaticamente `JwtAuthGuard` e `RolesGuard` como `APP_GUARD` globais.

```typescript
// apps/my-app/app.module.ts
import { AuthorizationModule } from '@hub/shared-module/authorization';
import { SharedCacheRedisModule } from '@hub/shared-module/cache';

@Module({
  imports: [
    SharedCacheRedisModule, // necessário para a denylist
    AuthorizationModule,
  ],
})
export class AppModule {}
```

---

## Protegendo rotas

### Rota pública (sem autenticação)

```typescript
import { Public } from '@hub/shared-module/authorization';

@Public()
@Get('health')
health() { return 'ok'; }
```

### Verificar permissão específica

O header `X-Tenant-Id` deve ser enviado pelo cliente em cada request para indicar o tenant ativo.

```typescript
import { Permission, PermissionGuard } from '@hub/shared-module/authorization';

@Get()
@Permission('billing.invoice.read')
@UseGuards(PermissionGuard)
findAll(@Headers('x-tenant-id') tenantId: string) {
  return this.service.findAll(tenantId);
}
```

O `PermissionGuard` verifica `user.tenants[tenantId]` diretamente do token JWT — sem consulta ao banco.

### Verificar role (⚠️ legado)

> `RolesGuard` e `@RolesGuards` estão mantidos por compatibilidade mas não devem ser usados em novos códigos.
> O campo `role` foi removido do token JWT. Use `@Permission()` + `PermissionGuard` em todos os novos códigos.

```typescript
import { RolesGuards } from '@hub/shared-module/authorization';

@Get('admin')
@RolesGuards(['ADMIN'])  // nunca retorna true no modelo atual
adminOnly() { ... }
```

---

## Formato do token JWT

O token emitido pelo `identity` no login contém:

```json
{
  "jti": "uuid-unico-por-token",
  "sub": "uuid-do-account",
  "email": "usuario@email.com",
  "role": "account",
  "status": true,
  "tenants": {
    "tenant-uuid-1": ["billing.invoice.read", "tenant.account.manage"],
    "tenant-uuid-2": ["identity.profile.update"]
  }
}
```

| Campo | Descrição |
|-------|-----------|
| `jti` | ID único do token — usado para revogação |
| `sub` | ID do account |
| `tenants` | Mapa de todos os tenants com as permissões do account em cada um |

---

## Revogação de tokens (denylist no Redis)

Tokens são revogados adicionando seu `jti` ao Redis com TTL igual ao tempo restante de expiração. Quando o token expira naturalmente, a entrada no Redis é removida automaticamente.

O `JwtAuthGuard` verifica a denylist em cada request após validar a assinatura.

### Revogar um token manualmente

```typescript
import { AuthorizationService } from '@hub/shared-module/authorization';

constructor(private readonly authorizationService: AuthorizationService) {}

// Revoga imediatamente (ex: logout)
await this.authorizationService.revokeToken(accessToken);

// Verificar se já foi revogado
const revoked = await this.authorizationService.isTokenRevoked(jti);
```

O logout do `identity` já revoga o access token automaticamente via `POST /auth/signout`.

---

## Fornecer avaliação de permissão via DB (fallback)

Se o token não possuir o campo `tenants` (tokens legados ou em ambiente de teste), o `PermissionGuard` cai em fallback e usa o `IPermissionEvaluator` injetado.

Para fornecer a implementação, registre no módulo do pacote:

```typescript
import { PERMISSION_EVALUATOR, IPermissionEvaluator } from '@hub/shared-module/authorization';

@Module({
  providers: [
    MyPermissionEvaluatorService, // implements IPermissionEvaluator
    {
      provide: PERMISSION_EVALUATOR,
      useExisting: MyPermissionEvaluatorService,
    },
  ],
})
export class MyModule {}
```

O `identity` já fornece essa implementação via `PermissionEvaluatorService`.

---

## Variáveis de ambiente necessárias

| Variável | Descrição |
|----------|-----------|
| `JWT_SECRET` | Secret para assinar/verificar tokens |
| `JWT_EXPIRES_IN` | Duração do access token (ex: `15m`, `1h`) |
| `REDIS_HOST` | Host do Redis (para denylist) |
| `REDIS_PORT` | Porta do Redis |
| `REDIS_PASSWORD` | Senha do Redis (opcional) |
