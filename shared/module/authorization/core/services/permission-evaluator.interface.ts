export interface PermissionEvaluationResult {
  allowed: boolean;
  effectiveLevel?: number;
  reason?: string;
}

export interface IPermissionEvaluator {
  evaluate(
    accountId: string,
    tenantId: string,
    permissionName: string,
  ): Promise<PermissionEvaluationResult>;
}

export const PERMISSION_EVALUATOR = 'PERMISSION_EVALUATOR';
