import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { DefaultTypeOrmEntity } from '@hub/shared-module/persistences';
import { SystemModule } from './modules.entities';

@Entity({ name: 'SystemResources' })
export class SystemResource extends DefaultTypeOrmEntity<SystemResource> {
  @Index()
  @Column({ type: 'uuid', nullable: false })
  public ModuleId: string;

  @Index({ unique: false })
  @Column({ nullable: false, length: 100 })
  public Slug: string;

  @Column({ nullable: false, length: 255 })
  public Name: string;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  public Description: string | null;

  @Column({ type: 'boolean', default: true })
  public Active: boolean;

  @ManyToOne(() => SystemModule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ModuleId' })
  public Module: SystemModule;
}
