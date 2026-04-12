import { Entity, Column, Index } from 'typeorm';
import { DefaultTypeOrmEntity } from '@hub/shared-module/persistences';

@Entity({ name: 'TenantRoles' })
export class TenantRole extends DefaultTypeOrmEntity<TenantRole> {
  @Index()
  @Column({ nullable: false, length: 255 })
  public TenantId: string;

  @Column({ nullable: false, length: 100 })
  public Name: string;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  public Description: string | null;
}
