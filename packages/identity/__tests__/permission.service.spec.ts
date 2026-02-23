import { PermissionService } from '../core/services/permission.service';
import { PermissionLevel } from 'shared/modules/authorization/core/enum/permission-level.enum';

describe('PermissionService', () => {
  let svc: PermissionService;

  beforeEach(() => {
    svc = new PermissionService();
  });

  it('maps sales.order.view to VIEW', () => {
    expect(svc.getRequiredLevelForPermission('sales.order.view')).toBe(PermissionLevel.VIEW);
  });

  it('maps sales.order.update to EDIT', () => {
    expect(svc.getRequiredLevelForPermission('sales.order.update')).toBe(PermissionLevel.EDIT);
  });

  it('maps refund related names to ADMIN', () => {
    expect(svc.getRequiredLevelForPermission('sales.order.refund')).toBe(PermissionLevel.ADMIN);
    expect(svc.getRequiredLevelForPermission('payments.refund.create')).toBe(PermissionLevel.ADMIN);
  });
});
