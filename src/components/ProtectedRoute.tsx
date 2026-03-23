import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const fetchedForUserId = useRef<string | null>(null);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setStatus(null);
      setStatusLoading(false);
      fetchedForUserId.current = null;
      return;
    }

    // Skip if we already fetched for this user
    if (fetchedForUserId.current === userId && status !== null) {
      return;
    }

    setStatusLoading(true);
    let cancelled = false;

    supabase
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          fetchedForUserId.current = userId;
          setStatus(data?.status ?? "pending");
          setStatusLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [userId]);

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
