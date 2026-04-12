import { v7 as uuidv7 } from 'uuid';
import {
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class DefaultTypeOrmEntity<T> {
  @PrimaryColumn({ type: 'uuid' })
  public Id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  public CreatedAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  public UpdatedAt: Date | null;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  public DeletedAt: Date | null;

  @BeforeInsert()
  beforeInsert(): void {
    this.CreatedAt = this.CreatedAt || new Date();
  }

  @BeforeUpdate()
  beforeUpdate(): void {
    this.UpdatedAt = new Date();
  }

  constructor(data: Partial<T>) {
    Object.assign(this, data);
    this.Id = this.Id || uuidv7();
  }
}
