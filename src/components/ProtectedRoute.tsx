import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStatus(null);
      setStatusLoading(false);
      return;
    }

    // Reset loading state when user changes
    setStatusLoading(true);

    let cancelled = false;
    supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setStatus(data?.status ?? "pending");
          setStatusLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [user]);

  if (loading || statusLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (status !== "active") {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
}
