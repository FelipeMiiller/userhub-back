import { registerAs } from '@nestjs/config';

export default registerAs('googleOAuth', () => ({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackFrontUser:
    `${process.env.FRONTEND_URL}/${process.env.GOOGLE_CALLBACK_USER_URL}` ||
    'localhost:3000/api/auth/google/callback',
  callbackBackendUser:
    `${process.env.ORIGIN}/auth/user/google/callback` || 'localhost:3005/auth/user/google/callback',
}));
