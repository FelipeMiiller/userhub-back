import { registerAs } from '@nestjs/config';

export default registerAs('s3', () => ({
  accessKeyId: process.env.BUCKET_ACCESS_KEY_ID,
  bucket: process.env.BUCKET_QRCODE_BUCKET,
  qrCodeExpires: +process.env.BUCKET_QRCODE_EXPIRES,
  secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY,
  url: process.env.BUCKET_URL,
}));
