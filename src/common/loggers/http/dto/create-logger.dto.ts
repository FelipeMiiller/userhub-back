import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsObject } from 'class-validator';

export class CreateLoggerDto {
  @IsOptional()
  @IsString()
  userId?: string;
  @IsString()
  level: string;
  @IsString()
  message: string;
  @IsOptional()
  @IsString()
  context?: string;
  @IsDateString()
  timestamp: Date;
  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}
