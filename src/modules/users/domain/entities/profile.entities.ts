import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from 'src/modules/users/domain/entities/users.entities';
import { ulid } from 'ulid';

@Entity({ name: 'Profiles' })
export class ProfileEntity {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  Id: string;

  @Index()
  @Column({ nullable: false, length: 255 })
  Name: string;

  @Column({ nullable: true, length: 255 })
  LastName: string | null;

  @Index()
  @Column({ nullable: true, type: 'text' })
  Bio: string | null;

  @Column({ nullable: true, length: 255 })
  AvatarUrl: string | null;

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'UserId' })
  User: UserEntity;

  @Column({ nullable: false, type: 'varchar', length: 26 })
  UserId: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)' })
  CreatedAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  UpdatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.Id = ulid();
  }
}
