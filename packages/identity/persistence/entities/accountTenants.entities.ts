import { Entity, Column, Index, Unique } from 'typeorm';
import { DefaultTypeOrmEntity } from '@hub/shared-module/persistences';

export type AccountTenantStatus = 'active' | 'inactive' | 'pending';

@Unique(['AccountId', 'TenantId'])
@Entity({ name: 'AccountTenants' })
export class AccountTenant extends DefaultTypeOrmEntity<AccountTenant> {
  @Index()
  @Column({ nullable: false, length: 255 })
  public AccountId: string;

  @Index()
  @Column({ nullable: false, length: 255 })
  public TenantId: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  public TenantRoleId: string | null;

  @Column({ nullable: false, length: 20, default: 'active' })
  public Status: AccountTenantStatus;

  @Column({ type: 'jsonb', nullable: true })
  public ExtraPermissions: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  public Metadata: Record<string, unknown> | null;
}
