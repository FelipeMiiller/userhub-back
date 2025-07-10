import { registerAs } from '@nestjs/config';
import { IsOptional, IsString, IsUrl } from 'class-validator';
import validateConfig from 'src/common/utils/validate-config';

class EnvironmentVariablesValidator {
  @IsUrl({ require_tld: false })
  @IsOptional()
  FRONTEND_DOMAIN: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  BACKEND_DOMAIN: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  @IsOptional()
  GOOGLE_SECRET: string;

  @IsString()
  @IsOptional()
  GOOGLE_CALLBACK_USER_URL: string;
}

export default registerAs('googleOAuth', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackFrontUser: `${process.env.FRONTEND_DOMAIN}/${process.env.GOOGLE_CALLBACK_USER_URL}`,
    callbackBackendUser: `${process.env.BACKEND_DOMAIN}/auth/google/callback`,
  };
});
