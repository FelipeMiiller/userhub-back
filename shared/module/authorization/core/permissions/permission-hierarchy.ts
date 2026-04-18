import { PermissionLevel } from '../enum/permission-level.enum';

/**
 * Mapeamento de ações para níveis hierárquicos.
 *
 * Regra: um nível superior implica todos os inferiores para o mesmo recurso.
 *   - VIEW/LIST  → nível 1 (VIEW)
 *   - CREATE → nível 2 (CREATE)
 *   - UPDATE → nível 3 (UPDATE)
 *   - DELETE → nível 4 (ADMIN)
 *
 * Ex.: quem tem `identity.account-tenant.delete` (ADMIN=4)
 *      implicitamente possui `list` (1), `create` (2) e `update` (3).
 */
const ACTION_LEVEL: Record<string, PermissionLevel> = {
  list: PermissionLevel.VIEW,
  view: PermissionLevel.VIEW,
  create: PermissionLevel.CREATE,
  update: PermissionLevel.UPDATE,
  delete: PermissionLevel.ADMIN,
};

export function getActionLevel(action: string): PermissionLevel {
  return ACTION_LEVEL[action] ?? PermissionLevel.NONE;
}

/**
 * Extrai `module`, `resource` e `action` de uma permission no formato
 * `{module}.{resource}.{action}`.
 */
export function parsePermission(
  perm: string,
): { module: string; resource: string; action: string } | null {
  const parts = perm.split('.');
  if (parts.length !== 3) return null;
  return { module: parts[0], resource: parts[1], action: parts[2] };
}

/**
 * Verifica se a permissão `held` cobre hierarquicamente a permissão `required`.
 *
 * Ambas devem pertencer ao mesmo `module.resource`.
 * Uma ação de nível superior implica todas as de nível inferior.
 */
export function permissionCovers(held: string, required: string): boolean {
  const h = parsePermission(held);
  const r = parsePermission(required);
  if (!h || !r) return false;
  if (h.module !== r.module || h.resource !== r.resource) return false;
  return getActionLevel(h.action) >= getActionLevel(r.action);
}

/**
 * Verifica se o array de permissões atende ao `required`, considerando
 * hierarquia de níveis.
 */
export function hasPermissionWithHierarchy(
  permissions: string[],
  required: string,
): boolean {
  return permissions.some((p) => p === required || permissionCovers(p, required));
}
