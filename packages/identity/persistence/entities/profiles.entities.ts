import { Entity, Column, Index } from 'typeorm';
import { DefaultTypeOrmEntity } from '@hub/shared-module/persistences';

@Entity({ name: 'Profiles' })
export class Profile extends DefaultTypeOrmEntity<Profile> {
  @Column({ nullable: false, length: 100 })
  public FirstName: string;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  public LastName: string | null;

  @Column({ type: 'varchar', nullable: true, length: 150 })
  public DisplayName: string | null;

  @Index()
  @Column({ type: 'varchar', nullable: true, length: 255 })
  public Email: string | null;

  @Column({ type: 'varchar', nullable: true, length: 30 })
  public Phone: string | null;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  public Photo: string | null;

  @Column({ type: 'date', nullable: true })
  public BirthDate: Date | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  public AccountId: string | null;
}
