/**
 * Catálogo estático de módulos e recursos da plataforma.
 *
 * É a única fonte de verdade para seed de SystemModules e SystemResources.
 * O CatalogSeedService lê esta estrutura e garante que as tabelas estejam
 * sempre em sincronia com o código — sem necessidade de CRUD manual.
 */
export const IDENTITY_MODULE_CATALOG = [
  {
    slug: 'identity',
    name: 'Identity',
    description: 'Gestão de identidade e acesso',
    resources: [
      { slug: 'tenant', name: 'Tenant' },
      { slug: 'account-tenant', name: 'Account Tenant' },
      { slug: 'tenant-role', name: 'Tenant Role' },
      { slug: 'tenant-module', name: 'Tenant Module' },
      { slug: 'catalog-module', name: 'Catalog Module' },
      { slug: 'permission', name: 'Permission' },
      { slug: 'profile', name: 'Profile' },
      { slug: 'address', name: 'Address' },
    ],
  },
] as const satisfies ReadonlyArray<{
  slug: string;
  name: string;
  description: string;
  resources: ReadonlyArray<{ slug: string; name: string }>;
}>;

/**
 * Catálogo tipado de permissões do módulo Identity.
 *
 * Formato: `{module}.{resource}.{action}`
 *
 * Use estas constantes nos decorators `@Permission()` em vez de strings
 * literais para garantir consistência e detectar typos em tempo de compilação.
 *
 * @example
 * ```typescript
 * import { IdentityPermissions } from '@hub/shared-module/authorization';
 *
 * @Permission(IdentityPermissions.TENANT_VIEW)
 * ```
 */
export const IdentityPermissions = {
  // ── Tenant ──────────────────────────────────────────────────────────────────
  TENANT_VIEW: 'identity.tenant.view',
  TENANT_UPDATE: 'identity.tenant.update',

  // ── Members (AccountTenant) ──────────────────────────────────────────────────
  ACCOUNT_TENANT_LIST: 'identity.account-tenant.list',
  ACCOUNT_TENANT_CREATE: 'identity.account-tenant.create',
  ACCOUNT_TENANT_DELETE: 'identity.account-tenant.delete',

  // ── TenantRole ───────────────────────────────────────────────────────────────
  TENANT_ROLE_LIST: 'identity.tenant-role.list',
  TENANT_ROLE_VIEW: 'identity.tenant-role.view',
  TENANT_ROLE_CREATE: 'identity.tenant-role.create',
  TENANT_ROLE_UPDATE: 'identity.tenant-role.update',
  TENANT_ROLE_DELETE: 'identity.tenant-role.delete',

  // ── TenantModule (módulos contratados por tenant) ────────────────────────────
  TENANT_MODULE_LIST: 'identity.tenant-module.list',
  TENANT_MODULE_CREATE: 'identity.tenant-module.create',
  TENANT_MODULE_DELETE: 'identity.tenant-module.delete',

  // ── Catalog (catálogo global de módulos/recursos — somente leitura para todos) ─
  CATALOG_MODULE_LIST: 'identity.catalog-module.list',
  CATALOG_MODULE_VIEW: 'identity.catalog-module.view',

  // ── Permission catalog (catálogo de permissões — admin) ──────────────────────
  PERMISSION_LIST: 'identity.permission.list',
  PERMISSION_VIEW: 'identity.permission.view',
  PERMISSION_CREATE: 'identity.permission.create',
  PERMISSION_DELETE: 'identity.permission.delete',

  // ── Profile ──────────────────────────────────────────────────────────────────
  PROFILE_VIEW: 'identity.profile.view',
  PROFILE_UPDATE: 'identity.profile.update',

  // ── Address ──────────────────────────────────────────────────────────────────
  ADDRESS_LIST: 'identity.address.list',
  ADDRESS_VIEW: 'identity.address.view',
  ADDRESS_CREATE: 'identity.address.create',
  ADDRESS_UPDATE: 'identity.address.update',
  ADDRESS_DELETE: 'identity.address.delete',
} as const;

export type IdentityPermission = (typeof IdentityPermissions)[keyof typeof IdentityPermissions];
