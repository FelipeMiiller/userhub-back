import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdateUser {
  @Field(() => String)
  @IsString()
  @IsOptional()
  readonly Email?: string;

  @Field(() => String)
  @IsString()
  @IsOptional()
  readonly Password?: string;

  @Field(() => String)
  @IsString()
  @IsOptional()
  readonly HashRefreshToken?: string;
}
