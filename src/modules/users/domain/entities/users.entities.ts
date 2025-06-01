import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  UpdateDateColumn,
  OneToOne,
  BeforeInsert,
  PrimaryColumn,
} from 'typeorm';
import { Roles } from '../models/users.models';
import { ProfileEntity } from './profile.entities';
import { ulid } from 'ulid';

@Entity({ name: 'Users' })
export class UserEntity {
  // @Column({ primary: true, generated: 'uuid', nullable: false })
  @PrimaryColumn({ type: 'varchar', length: 26 })
  public Id: string;

  @Index()
  @Column({ nullable: false, length: 255 })
  public Email: string;

  @Column({ nullable: true, length: 255 })
  public Password: string | null;

  @Index()
  @Column({ nullable: true, length: 255 })
  public HashRefreshToken: string | null;

  @Column({ nullable: false })
  public Role: Roles;

  @Column({ type: 'boolean', default: true })
  public Status: boolean;

  @OneToOne(() => ProfileEntity, (Profile) => Profile.User, { cascade: true, eager: true })
  public Profile: ProfileEntity;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  public CreatedAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  public UpdatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.Id = ulid();
  }
}
