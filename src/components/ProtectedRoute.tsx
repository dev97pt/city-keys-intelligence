import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  // status: null = not yet fetched, string = fetched
  const [status, setStatus] = useState<string | null>(null);
  const lastFetchedUserId = useRef<string | null>(null);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      lastFetchedUserId.current = null;
      setStatus(null);
      return;
    }

    // Already fetched for this user
    if (lastFetchedUserId.current === userId) return;

    let cancelled = false;
    supabase
      .from("profiles")
      .select("status")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          lastFetchedUserId.current = userId;
          setStatus(data?.status ?? "pending");
        }
      });

    return () => { cancelled = true; };
  }, [userId]);

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
  if (status === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Status fetched but not active
  if (status !== "active") {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
}
