import { ReactNode } from 'react';

interface RoleBasedAccessProps {
  roles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleBasedAccess({ roles, children, fallback = null }: RoleBasedAccessProps) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!user.role || !roles.includes(user.role)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Helper component for common role combinations
export function AdminOnly({ children }: { children: ReactNode }) {
  return <RoleBasedAccess roles={['admin']}>{children}</RoleBasedAccess>;
}

export function ApproverAccess({ children }: { children: ReactNode }) {
  return <RoleBasedAccess roles={['admin', 'approver']}>{children}</RoleBasedAccess>;
}

export function DataEntryAccess({ children }: { children: ReactNode }) {
  return <RoleBasedAccess roles={['admin', 'data-entry']}>{children}</RoleBasedAccess>;
}

export function PrinterAccess({ children }: { children: ReactNode }) {
  return <RoleBasedAccess roles={['admin', 'printer']}>{children}</RoleBasedAccess>;
}

export function EditorAccess({ children }: { children: ReactNode }) {
  return <RoleBasedAccess roles={['admin', 'editor']}>{children}</RoleBasedAccess>;
}
