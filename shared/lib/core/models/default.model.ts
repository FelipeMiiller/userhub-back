export class DefaultModel<T> {
  readonly Id: string;
  readonly CreatedAt: Date;
  readonly UpdatedAt: Date | null;
  readonly DeletedAt: Date | null;

  constructor(partial: Partial<T>) {
    Object.assign(this, partial);
  }
}
