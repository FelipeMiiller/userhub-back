import { Entity, Column, Index, Unique } from 'typeorm';
import { DefaultTypeOrmEntity } from '@hub/shared-module/persistences';

export type AccountTenantPermissionMode = 'grant' | 'deny';

/**
 * Permissão extra concedida ou negada individualmente a um AccountTenant.
 *
 * Substitui o campo jsonb `ExtraPermissions` da tabela `AccountTenants`
 * para permitir rastreabilidade de auditoria com `CreatedAt`/`UpdatedAt`/`DeletedAt`.
 *
 * Regra de precedência (mesma do jsonb anterior):
 *   - Mode = 'deny' prevalece sobre qualquer grant de role ou grant extra
 *   - Mode = 'grant' complementa as permissões do role
 */
@Unique(['AccountTenantId', 'PermissionId', 'Mode'])
@Entity({ name: 'AccountTenantPermissions' })
export class AccountTenantPermission extends DefaultTypeOrmEntity<AccountTenantPermission> {
  @Index()
  @Column({ type: 'uuid', nullable: false })
  public AccountTenantId: string;

  @Index()
  @Column({ type: 'uuid', nullable: false })
  public PermissionId: string;

  @Column({ type: 'varchar', length: 10, nullable: false, default: 'grant' })
  public Mode: AccountTenantPermissionMode;
}
