import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

export const Permission = (permissionName: string) =>
  SetMetadata(PERMISSION_KEY, permissionName);
