import { Entity, Column, Index } from 'typeorm';
import { DefaultTypeOrmEntity } from '@hub/shared-module/persistences';

@Entity({ name: 'SystemModules' })
export class SystemModule extends DefaultTypeOrmEntity<SystemModule> {
  @Index({ unique: true })
  @Column({ nullable: false, length: 100 })
  public Slug: string;

  @Column({ nullable: false, length: 255 })
  public Name: string;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  public Description: string | null;

  @Column({ type: 'boolean', default: true })
  public Active: boolean;
}
