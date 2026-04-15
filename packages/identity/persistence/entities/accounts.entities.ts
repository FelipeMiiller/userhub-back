import { Entity, Column, Index } from 'typeorm';
import { DefaultTypeOrmEntity } from '@hub/shared-module/persistences';

@Entity({ name: 'Accounts' })
export class Account extends DefaultTypeOrmEntity<Account> {
  @Index({ unique: true, where: '"DeletedAt" IS NULL' })
  @Column({ nullable: false, length: 255 })
  public Email: string;

  @Column({ nullable: false, length: 255 })
  public Password: string;

  @Index()
  @Column({ type: 'varchar', nullable: true, length: 255 })
  public HashRefreshToken: string | null;

  @Column({ nullable: false, length: 50, default: 'local' })
  public Provider: string;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  public ProviderId: string | null;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  public ExternalId: string | null;

  @Column({ type: 'boolean', default: false })
  public EmailVerified: boolean;

  @Column({ type: 'boolean', default: true })
  public Status: boolean;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  public ProfileId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  public Metadata: Record<string, unknown> | null;
}
