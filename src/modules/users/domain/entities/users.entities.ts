import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  UpdateDateColumn,
  BeforeInsert,
  PrimaryColumn,
} from 'typeorm';
import { Roles } from '../models/users.models';
import { ulid } from 'ulid';

@Entity({ name: 'Users' })
export class UserEntity {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  public Id: string;

  @Index()
  @Column({ nullable: false, length: 255, unique: true })
  public Email: string;

  @Column({ nullable: false, length: 255 })
  public Password: string;

  @Column({ nullable: false, length: 100 })
  public Name: string;

  @Column({ nullable: true, length: 100 })
  public LastName: string | null;

  @Column({ nullable: true, length: 255 })
  public AvatarUrl: string | null;

  @Index()
  @Column({ nullable: true, length: 255 })
  public HashRefreshToken: string | null;

  @Column({ nullable: false, type: 'enum', enum: Roles })
  public Role: Roles;

  @Column({ type: 'boolean', default: true })
  public Status: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  public LastLoginAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP(6)' })
  public CreatedAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  public UpdatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.Id = ulid();
  }
}
