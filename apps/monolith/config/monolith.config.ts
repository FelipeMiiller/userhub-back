import { registerAs } from '@nestjs/config';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import validateConfig from 'shared/lib/utils/validate-config';

export type AppConfig = {
  port: number;
};

class EnvironmentVariablesValidator {
  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  MONOLITH_API_PORT: number;
}

export default registerAs('monolith', (): AppConfig => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    port: parseInt(process.env.MONOLITH_API_PORT, 10),
  };
});
