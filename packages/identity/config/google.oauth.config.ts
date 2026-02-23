import { registerAs } from '@nestjs/config';
import { IsString, IsUrl } from 'class-validator';
import { configValidator } from '@hub/shared-module/config';


class EnvironmentVariablesValidator {
  @IsUrl({ require_tld: false })
  FRONTEND_DOMAIN: string;

  @IsUrl({ require_tld: false })
  BACKEND_DOMAIN: string;

  @IsString()
  GOOGLE_CLIENT_ID: string;

  @IsString()
  GOOGLE_SECRET: string;

  @IsString()
  GOOGLE_CALLBACK_USER_PATH: string;
}

export default registerAs('googleOAuth', () => {
  const config = configValidator(process.env, EnvironmentVariablesValidator);
  return {
    clientId: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_SECRET,
    callbackFrontUser: `${config.FRONTEND_DOMAIN}/${config.GOOGLE_CALLBACK_USER_PATH}`,
    callbackBackendUser: `${config.BACKEND_DOMAIN}/auth/google/callback`,
  };
});
