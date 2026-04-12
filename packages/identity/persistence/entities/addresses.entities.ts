import { Entity, Column, Index } from 'typeorm';
import { DefaultTypeOrmEntity } from '@hub/shared-module/persistences';

export type AddressType = 'home' | 'work' | 'delivery' | 'billing';

@Entity({ name: 'Addresses' })
export class Address extends DefaultTypeOrmEntity<Address> {
  @Index()
  @Column({ nullable: false, length: 255 })
  public ProfileId: string;

  @Column({ nullable: false, length: 20, default: 'home' })
  public Type: AddressType;

  @Column({ nullable: false, length: 255 })
  public Street: string;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  public Number: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  public Complement: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  public Neighborhood: string | null;

  @Column({ nullable: false, length: 100 })
  public City: string;

  @Column({ nullable: false, length: 50 })
  public State: string;

  @Column({ nullable: false, length: 50, default: 'BR' })
  public Country: string;

  @Column({ type: 'varchar', nullable: true, length: 20 })
  public ZipCode: string | null;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  public Formatted: string | null;

  @Column({ type: 'varchar', nullable: true, length: 500 })
  public Location: string | null;
}
