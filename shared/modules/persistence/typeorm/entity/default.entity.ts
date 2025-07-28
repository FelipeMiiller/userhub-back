import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ulid } from 'ulid';

export abstract class DefaultEntity<T> {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  public Id: string;

  @CreateDateColumn()
  public CreatedAt: Date;

  @UpdateDateColumn()
  public UpdatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  public DeletedAt: Date | null;

  constructor(data: Partial<T>) {
    Object.assign(this, data);
    this.Id = this.Id || ulid();
  }

  @BeforeInsert()
  beforeInsert(): void {
    this.CreatedAt = this.CreatedAt || new Date();
  }

  @BeforeUpdate()
  beforeUpdate(): void {
    this.UpdatedAt = new Date();
  }
}
