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
      setStatusLoading(false);
      return;
    }
    supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setStatus(data?.status ?? "pending");
        setStatusLoading(false);
      });
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
