import { Entity, Column, Index, Unique } from 'typeorm';
import { DefaultTypeOrmEntity } from '@hub/shared-module/persistences';

export type TenantModuleStatus = 'active' | 'inactive';

@Unique(['TenantId', 'SystemModuleId'])
@Entity({ name: 'TenantModules' })
export class TenantModule extends DefaultTypeOrmEntity<TenantModule> {
  @Index()
  @Column({ type: 'uuid', nullable: false })
  public TenantId: string;

  @Index()
  @Column({ type: 'uuid', nullable: false })
  public SystemModuleId: string;

  @Column({ nullable: false, length: 20, default: 'active' })
  public Status: TenantModuleStatus;
}
