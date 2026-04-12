import { Entity, Column, Index } from 'typeorm';
import { DefaultTypeOrmEntity } from '@hub/shared-module/persistences';

export type TenantStatus = 'active' | 'inactive' | 'suspended';

@Entity({ name: 'Tenants' })
export class Tenant extends DefaultTypeOrmEntity<Tenant> {
  @Column({ nullable: false, length: 255 })
  public Name: string;

  @Index({ unique: true })
  @Column({ nullable: false, length: 100 })
  public Slug: string;

  @Column({ nullable: false, length: 20, default: 'active' })
  public Status: TenantStatus;

  @Column({ type: 'jsonb', nullable: true })
  public Metadata: Record<string, unknown> | null;
}
