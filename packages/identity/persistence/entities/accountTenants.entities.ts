import { Entity, Column, Index, Unique } from 'typeorm';
import { DefaultTypeOrmEntity } from '@hub/shared-module/persistences';

export type AccountTenantStatus = 'active' | 'inactive' | 'pending';

@Unique(['AccountId', 'TenantId'])
@Entity({ name: 'AccountTenants' })
export class AccountTenant extends DefaultTypeOrmEntity<AccountTenant> {
  @Index()
  @Column({ type: 'uuid', nullable: false })
  public AccountId: string;

  @Index()
  @Column({ type: 'uuid', nullable: false })
  public TenantId: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  public TenantRoleId: string | null;

  @Column({ nullable: false, length: 20, default: 'active' })
  public Status: AccountTenantStatus;

  @Column({ type: 'jsonb', nullable: true })
  public Metadata: Record<string, unknown> | null;
}
