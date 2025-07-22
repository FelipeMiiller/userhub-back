import { Column, Entity, Index } from 'typeorm';
import { DefaultEntity } from 'shared/modules/persistence/typeorm/entity/default.entity';
import { Roles } from 'packages/identity/core/enum/role.enum';

@Entity({ name: 'Users' })
export class UserEntity extends DefaultEntity<UserEntity> {
  @Index()
  @Column({ nullable: false, length: 255, unique: true })
  public Email: string;

  @Column({ nullable: false, length: 255 })
  public Password: string;

  @Column({ nullable: false, length: 100 })
  public FirstName: string;

  @Column({ nullable: true, length: 100 })
  public LastName: string | null;

  @Column({ nullable: true, length: 255 })
  public Photo: string | null;

  @Index()
  @Column({ nullable: true, length: 255 })
  public HashRefreshToken: string | null;

  @Column({ nullable: false, type: 'enum', enum: Roles })
  public Role: Roles;

  @Column({ type: 'boolean', default: true })
  public Status: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  public LastLoginAt: Date | null;
}
