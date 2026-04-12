import { Injectable } from '@nestjs/common';

@Injectable()
export class PermissionService {
  /**
   * Checks whether a given AllowedLevel and Mode combination results in allowed access.
   */
  isAllowed(mode: string, allowedLevel: number): boolean {
    if (mode === 'deny') return false;
    return allowedLevel > 0;
  }
}
