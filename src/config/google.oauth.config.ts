import { registerAs } from '@nestjs/config';

export default registerAs('googleOAuth', () => ({
  clientId: process.env.GOOGLE_CLIENT_ID || 'google-client-id',
  clientSecret: process.env.GOOGLE_SECRET || 'google-secret',
  callbackFrontUser:
    `${process.env.FRONTEND_URL}/${process.env.GOOGLE_CALLBACK_USER_URL}` ||
    'localhost:3000/api/auth/google/callback',
  callbackBackendUser:
    `${process.env.ORIGIN}/auth/google/callback` || 'localhost:3005/auth/google/callback',
}));
