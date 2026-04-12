export interface Payload {
  /** JWT ID — identificador único do token. Usado para revogar tokens individualmente. */
  jti?: string;
  email: string;
  sub: string;
  status: boolean;
  /**
   * Mapa de todos os tenants do account e as permissões em cada um.
   * Embutido no token no momento do login.
   * Formato: { [tenantId]: permissionNames[] }
   * Exemplo: { "tenant-uuid": ["billing.invoice.read", "tenant.account.manage"] }
   */
  tenants?: Record<string, string[]>;
}

export interface Login {
  accessToken: string;
  refreshToken: string;
}
