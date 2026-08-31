import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: 'site_admin' | 'job_admin';
  requireOfferAccess?: boolean;
}

export const ProtectedRoute = ({ children, requireRole, requireOfferAccess }: ProtectedRouteProps) => {
  const { role, canViewOffers, loading } = useUserPermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Check role-based access
  if (requireRole) {
    if (requireRole === 'site_admin' && role !== 'site_admin') {
      return <Navigate to="/dashboard" replace />;
    }
    if (requireRole === 'job_admin' && role !== 'site_admin' && role !== 'job_admin') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Check offer access
  if (requireOfferAccess && !canViewOffers()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
