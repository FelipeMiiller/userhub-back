import { PermissionService } from '../services/permission.service';

describe('PermissionService (Serviço de Permissão)', () => {
  let svc: PermissionService;

  beforeEach(() => {
    svc = new PermissionService();
  });

  it('permite quando modo é allow e nível > 0', () => {
    expect(svc.isAllowed('allow', 1)).toBe(true);
    expect(svc.isAllowed('allow', 2)).toBe(true);
  });

  it('nega quando modo é deny independente do nível', () => {
    expect(svc.isAllowed('deny', 1)).toBe(false);
    expect(svc.isAllowed('deny', 2)).toBe(false);
  });

  it('nega quando nível é 0', () => {
    expect(svc.isAllowed('allow', 0)).toBe(false);
  });
});
