import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Send, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
  likes: { id: string; user_id: string }[];
  comments: { id: string; user_id: string; content: string; created_at: string; profiles: { full_name: string | null } | null }[];
}

const categories = [
  { value: "general", label: "Community Feed" },
  { value: "city-discussion", label: "City Discussions" },
  { value: "deal-analysis", label: "Deal Analysis" },
  { value: "introduction", label: "Introductions" },
  { value: "founder-insight", label: "Founder Insights" },
];

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("general");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, user_id, title, content, category, created_at, profiles(full_name), likes(id, user_id), comments(id, user_id, content, created_at, profiles(full_name))")
      .eq("category", activeCategory)
      .order("created_at", { ascending: false });
    setPosts((data as unknown as Post[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchPosts();
  }, [activeCategory]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("community")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => fetchPosts())
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => fetchPosts())
      .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeCategory]);

  const handlePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const { error } = await supabase.from("posts").insert({
      user_id: user!.id,
      title: newTitle,
      content: newContent,
      category: newCategory,
    });
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setNewTitle("");
      setNewContent("");
      setDialogOpen(false);
    }
  };

  const handleLike = async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    const alreadyLiked = post?.likes.some((l) => l.user_id === user?.id);
    if (alreadyLiked) {
      await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user!.id);
    } else {
      await supabase.from("likes").insert({ post_id: postId, user_id: user!.id });
    }
  };

  const handleComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    await supabase.from("comments").insert({ post_id: postId, user_id: user!.id, content });
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Community</h1>
          <p className="mt-1 text-sm text-muted-foreground">Connect with fellow builders.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> New Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Category</Label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Title</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} className="mt-1" rows={4} />
              </div>
              <Button onClick={handlePost} className="w-full bg-primary text-primary-foreground">Post</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category tabs */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => setActiveCategory(c.value)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs transition-colors ${
              activeCategory === c.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">No posts yet. Be the first!</p>
          </div>
        ) : (
          posts.map((post) => {
            const liked = post.likes.some((l) => l.user_id === user?.id);
            return (
              <div key={post.id} className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{post.profiles?.full_name || "Anonymous"}</span>
                  <span>·</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="mt-2 font-serif text-lg font-semibold text-foreground">{post.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>

                <div className="mt-4 flex items-center gap-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      liked ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${liked ? "fill-primary" : ""}`} />
                    {post.likes.length}
                  </button>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    {post.comments.length}
                  </span>
                </div>

                {/* Comments */}
                {post.comments.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    {post.comments.map((c) => (
                      <div key={c.id} className="text-xs">
                        <span className="font-medium text-foreground">{c.profiles?.full_name || "Anonymous"}</span>
                        <span className="ml-2 text-muted-foreground">{c.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <Input
                    placeholder="Write a comment…"
                    value={commentInputs[post.id] || ""}
                    onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                    className="text-xs h-8"
                  />
                  <Button size="sm" variant="ghost" onClick={() => handleComment(post.id)} className="h-8 px-2">
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
