import type { UserRole } from "./models";

export interface AuthUser {
  userId: string;
  tenantId: string;
  role: UserRole;
  name?: string;
  email?: string;
}

export interface AuthState {
  user: AuthUser | null;
  permissions: Record<string, boolean>;
  isLoading: boolean;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
  canAccess: (module: string, action: string) => boolean;
}
