import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Search, Check, X, UserX, UserPlus, Trash2, Crown, Ban, Eye } from "lucide-react";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminCityPapers } from "@/components/admin/AdminCityPapers";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").then(({ data }) => {
      setIsAdmin(data && data.length > 0);
    });
  }, [user]);
  return isAdmin;
}

/* ── Pending Approvals ── */
function PendingApprovals() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, country_origin, relocation_stage, created_at, avatar_url, status")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleAction = async (id: string, status: string) => {
    const { error } = await supabase.from("profiles").update({ status } as any).eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: status === "active" ? "User approved" : "User rejected" });
      fetch();
    }
  };

  if (loading) return <Spinner />;
  if (users.length === 0) return <EmptyState text="No pending approvals." />;

  return (
    <div className="space-y-3">
      {users.map((u) => (
        <div key={u.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={u.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-serif">
                {(u.full_name || "?").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">{u.full_name || "—"}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
              <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                {u.country_origin && <span>From: {u.country_origin}</span>}
                {u.relocation_stage && <span>· {u.relocation_stage}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleAction(u.id, "active")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Check className="mr-1.5 h-3.5 w-3.5" /> Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleAction(u.id, "rejected")}>
              <X className="mr-1.5 h-3.5 w-3.5" /> Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── User Management ── */
function UserManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchAll = async () => {
    const [{ data: profileData }, { data: roleData }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setUsers(profileData || []);
    const rm: Record<string, string[]> = {};
    (roleData || []).forEach((r: any) => {
      if (!rm[r.user_id]) rm[r.user_id] = [];
      rm[r.user_id].push(r.role);
    });
    setRoles(rm);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("profiles").update({ status } as any).eq("id", id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: `User status updated to ${status}` }); fetchAll(); }
  };

  const toggleAdmin = async (userId: string) => {
    const isAdmin = roles[userId]?.includes("admin");
    if (isAdmin) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" } as any);
    }
    toast({ title: isAdmin ? "Admin role removed" : "Admin role granted" });
    fetchAll();
  };

  const deleteUser = async (userId: string) => {
    // Delete profile (cascades)
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "User deleted" }); fetchAll(); }
  };

  const filtered = users.filter((u) => {
    if (filterStatus !== "all" && u.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return (u.full_name || "").toLowerCase().includes(s) || (u.email || "").toLowerCase().includes(s);
    }
    return true;
  });

  if (loading) return <Spinner />;

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    suspended: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {["all", "active", "pending", "rejected", "suspended"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${
                filterStatus === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState text="No users found." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 w-40"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isUserAdmin = roles[u.id]?.includes("admin");
                return (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-card/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={u.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{(u.full_name || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-xs">{u.full_name || "—"}</p>
                          <p className="text-[10px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-[10px] ${statusColors[u.status] || ""}`}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {isUserAdmin ? <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Admin</Badge> : "Member"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {u.status === "pending" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-400" onClick={() => updateStatus(u.id, "active")}>
                            <Check className="h-3 w-3 mr-1" /> Approve
                          </Button>
                        )}
                        {u.status === "active" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-400" onClick={() => updateStatus(u.id, "suspended")}>
                            <Ban className="h-3 w-3 mr-1" /> Suspend
                          </Button>
                        )}
                        {u.status === "suspended" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-400" onClick={() => updateStatus(u.id, "active")}>
                            <Check className="h-3 w-3 mr-1" /> Activate
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleAdmin(u.id)}>
                          <Crown className={`h-3 w-3 mr-1 ${isUserAdmin ? "text-primary" : "text-muted-foreground"}`} />
                          {isUserAdmin ? "Remove Admin" : "Make Admin"}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => deleteUser(u.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Community Moderation ── */
function CommunityModeration() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, title, content, category, created_at, user_id, profiles(full_name, email), comments(id, content, user_id, created_at, profiles(full_name))")
      .order("created_at", { ascending: false })
      .limit(100);
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const deletePost = async (id: string) => {
    await supabase.from("posts").delete().eq("id", id);
    toast({ title: "Post deleted" });
    fetchPosts();
  };

  const deleteComment = async (id: string) => {
    await supabase.from("comments").delete().eq("id", id);
    toast({ title: "Comment deleted" });
    fetchPosts();
  };

  const banUser = async (userId: string) => {
    await supabase.from("profiles").update({ status: "suspended" } as any).eq("id", userId);
    toast({ title: "User suspended" });
  };

  const filtered = posts.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.title.toLowerCase().includes(s) || p.content.toLowerCase().includes(s) || (p.profiles?.full_name || "").toLowerCase().includes(s);
  });

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="relative max-w-xs mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search posts…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState text="No posts found." />
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div key={post.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{post.profiles?.full_name || "Anonymous"}</span>
                    <span>·</span>
                    <span>{post.category}</span>
                    <span>·</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 className="mt-1 font-serif text-sm font-semibold text-foreground">{post.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                </div>
                <div className="flex gap-1 ml-4 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-orange-400" onClick={() => banUser(post.user_id)}>
                    <Ban className="h-3 w-3 mr-1" /> Ban
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => deletePost(post.id)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
              </div>

              {post.comments?.length > 0 && (
                <div className="mt-3 border-t border-border/50 pt-3 space-y-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    {post.comments.length} comment{post.comments.length > 1 ? "s" : ""}
                  </p>
                  {post.comments.map((c: any) => (
                    <div key={c.id} className="flex items-start justify-between text-xs">
                      <div>
                        <span className="font-medium text-foreground">{c.profiles?.full_name || "Anonymous"}</span>
                        <span className="ml-2 text-muted-foreground">{c.content}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 px-1.5 text-destructive shrink-0" onClick={() => deleteComment(c.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Shared Components ── */
function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-center text-sm text-muted-foreground py-12">{text}</p>;
}

/* ── Main Admin Panel ── */
export default function AdminPanel() {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">Admin Access Required</h1>
          <p className="mt-2 text-sm text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-3xl font-semibold text-foreground">Admin Panel</h1>
      <p className="mt-2 text-sm text-muted-foreground">Manage platform content, members, and analytics.</p>

      <Tabs defaultValue="analytics" className="mt-8">
        <TabsList className="bg-secondary flex-wrap">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="city-papers">City Papers</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <AdminAnalytics />
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          <PendingApprovals />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="moderation" className="mt-6">
          <CommunityModeration />
        </TabsContent>

        <TabsContent value="city-papers" className="mt-6">
          <AdminCityPapers />
        </TabsContent>
      </Tabs>
    </div>
  );
}
