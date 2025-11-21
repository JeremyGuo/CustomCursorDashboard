export type Role = string;

export interface ServiceDefinition {
  id: string;
  name: string;
  description?: string;
  entryHtml: string;
  entryScript: string;
  requiredRoles?: Role[];
  proxyRewrite?: string;
  proxyTarget?: string;
}

export interface ServiceRuntime extends ServiceDefinition {
  absHtmlPath: string;
  absScriptPath: string;
  workblookPath: string;
  planPath: string;
  apiDocPath: string;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  roles: Role[];
  services: string[];
  createdAt: string;
}

export interface AuthTokenPayload {
  sub: string;
  username: string;
  roles: Role[];
  services: string[];
}

export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface RegistrationRequest {
  id: string;
  username: string;
  passwordHash: string;
  status: RegistrationStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  reason?: string;
}
