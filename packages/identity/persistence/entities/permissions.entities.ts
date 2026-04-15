import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { DefaultTypeOrmEntity } from '@hub/shared-module/persistences';
import { SystemModule } from './modules.entities';
import { SystemResource } from './resources.entities';

@Entity({ name: 'Permissions' })
export class Permission extends DefaultTypeOrmEntity<Permission> {
  @Index({ unique: true, where: '"DeletedAt" IS NULL' })
  @Column({ nullable: false, length: 255 })
  public Name: string;

  @Index()
  @Column({ type: 'uuid', nullable: false })
  public ModuleId: string;

  @Index()
  @Column({ type: 'uuid', nullable: false })
  public ResourceId: string;

  @Column({ nullable: false, length: 50 })
  public Action: string;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  public Description: string | null;

  @ManyToOne(() => SystemModule, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ModuleId' })
  public Module: SystemModule;

  @ManyToOne(() => SystemResource, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ResourceId' })
  public Resource: SystemResource;
}
