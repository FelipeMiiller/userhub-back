import { Expose } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsOptional, isUUID, IsUUID } from 'class-validator';

export abstract class DefaultResponseDto {
  @IsUUID('7')
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
