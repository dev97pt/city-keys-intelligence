import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, DollarSign, MessageSquare, Calendar } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalBookings: number;
  paidBookings: number;
  totalPosts: number;
  totalComments: number;
  recentUsers: { email: string | null; created_at: string }[];
  recentBookings: { id: string; payment_status: string; booking_status: string; created_at: string }[];
}

export function AdminAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [profiles, bookings, posts, comments] = await Promise.all([
        supabase.from("profiles").select("email,created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(10),
        supabase.from("bookings").select("id,payment_status,booking_status,created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(10),
        supabase.from("posts").select("id", { count: "exact" }),
        supabase.from("comments").select("id", { count: "exact" }),
      ]);

      const paidCount = bookings.data?.filter((b) => b.payment_status === "paid").length ?? 0;

      setStats({
        totalUsers: profiles.count ?? 0,
        totalBookings: bookings.count ?? 0,
        paidBookings: paidCount,
        totalPosts: posts.count ?? 0,
        totalComments: comments.count ?? 0,
        recentUsers: profiles.data || [],
        recentBookings: bookings.data || [],
      });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: "Total Members", value: stats.totalUsers, icon: Users, color: "text-primary" },
    { label: "Total Bookings", value: stats.totalBookings, icon: Calendar, color: "text-blue-400" },
    { label: "Paid Bookings", value: stats.paidBookings, icon: DollarSign, color: "text-green-400" },
    { label: "Community Posts", value: stats.totalPosts, icon: MessageSquare, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-secondary p-2">
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
            </div>
            <p className="font-mono text-2xl font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Users */}
      <div>
        <h3 className="font-serif text-lg font-semibold text-foreground mb-4">Recent Members</h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((u, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="px-4 py-3 text-foreground">{u.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Bookings */}
      <div>
        <h3 className="font-serif text-lg font-semibold text-foreground mb-4">Recent Bookings</h3>
        {stats.recentBookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((b) => (
                  <tr key={b.id} className="border-b border-border/50">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{b.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.payment_status === "paid" ? "bg-green-400/10 text-green-400" : "bg-yellow-400/10 text-yellow-400"
                      }`}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.booking_status === "confirmed" ? "bg-green-400/10 text-green-400" : "bg-secondary text-muted-foreground"
                      }`}>
                        {b.booking_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Community Summary */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-serif text-lg font-semibold text-foreground mb-2">Community Engagement</h3>
        <div className="grid grid-cols-2 gap-6 mt-4">
          <div>
            <p className="font-mono text-3xl font-bold text-foreground">{stats.totalPosts}</p>
            <p className="text-sm text-muted-foreground">Total Posts</p>
          </div>
          <div>
            <p className="font-mono text-3xl font-bold text-foreground">{stats.totalComments}</p>
            <p className="text-sm text-muted-foreground">Total Comments</p>
          </div>
        </div>
      </div>
    </div>
  );
}
