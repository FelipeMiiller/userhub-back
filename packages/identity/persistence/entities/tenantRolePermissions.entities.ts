import { Entity, Column, Index } from 'typeorm';
import { DefaultTypeOrmEntity } from '@hub/shared-module/persistences';

export type PermissionMode = 'allow' | 'deny';

@Entity({ name: 'TenantRolePermissions' })
export class TenantRolePermission extends DefaultTypeOrmEntity<TenantRolePermission> {
  @Index()
  @Column({ nullable: false, length: 255 })
  public TenantRoleId: string;

  @Index()
  @Column({ nullable: false, length: 255 })
  public PermissionId: string;

  @Column({ nullable: false, type: 'int', default: 1 })
  public AllowedLevel: number;

  @Column({ nullable: false, length: 10, default: 'allow' })
  public Mode: PermissionMode;
}
