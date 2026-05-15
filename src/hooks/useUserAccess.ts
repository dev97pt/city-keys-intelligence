import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export type UserAccess = {
  isAdmin: boolean;
  status: string | null;
};

export async function getUserAccess(userId: string): Promise<UserAccess> {
  const [profileResult, roleResult] = await Promise.all([
    supabase.from("profiles").select("status").eq("id", userId).maybeSingle(),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle(),
  ]);

  return {
    isAdmin: roleResult.data?.role === "admin",
    status: profileResult.data?.status ?? "pending",
  };
}

export function getDashboardRedirectPath(access: UserAccess) {
  if (access.isAdmin) return "/dashboard/admin";
  if (access.status === "active") return "/dashboard";
  return "/pending";
}

export function useUserAccess() {
  const { user, loading: authLoading } = useAuth();
  const [access, setAccess] = useState<UserAccess>({ isAdmin: false, status: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setAccess({ isAdmin: false, status: null });
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getUserAccess(user.id).then((nextAccess) => {
      if (!cancelled) {
        setAccess(nextAccess);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  return { ...access, loading: authLoading || loading };
}