import { registerAs } from '@nestjs/config';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { configValidator } from '@hub/shared-module/config';

export type AppConfig = {
  port: number;
};

class EnvironmentVariablesValidator {
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  IDENTITY_API_PORT: number;
}

export default registerAs('identity', (): AppConfig => {
  const cfg = configValidator<EnvironmentVariablesValidator>(
    process.env,
    EnvironmentVariablesValidator,
  );

  return {
    port: cfg.IDENTITY_API_PORT || 3005,
  };
});
