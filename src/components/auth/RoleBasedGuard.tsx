import type { PropsWithChildren, ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../types/common.types';

type RoleBasedGuardProps = PropsWithChildren<{
  allow: Exclude<UserRole, null>[];
  fallback?: ReactNode;
}>;

export const RoleBasedGuard = ({ allow, fallback = null, children }: RoleBasedGuardProps) => {
  const { role } = useAuth();

  if (!role || !allow.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
