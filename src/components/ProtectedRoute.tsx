import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useUserAccess } from "@/hooks/useUserAccess";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isAdmin, status, loading: accessLoading } = useUserAccess();
  const location = useLocation();

  // Still loading auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // No user at all
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User exists but status not yet fetched
  if (accessLoading || status === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAdmin && location.pathname === "/dashboard") {
    return <Navigate to="/dashboard/admin" replace />;
  }

  // Admin access always wins over profile approval status.
  if (!isAdmin && status !== "active") {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
}
