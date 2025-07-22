import { Expose } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { IsULID } from 'shared/lib/utils/validators/is-ulid.validator';

export abstract class DefaultResponseDto {
  @IsULID()
  @IsNotEmpty()
  @Expose()
  readonly Id: string;

  @IsDateString()
  @Expose()
  readonly CreatedAt: Date;

  @IsDateString()
  @Expose()
  readonly UpdatedAt: Date;

  @IsDateString()
  @Expose()
  @IsOptional()
  readonly DeletedAt: Date | null;
}
