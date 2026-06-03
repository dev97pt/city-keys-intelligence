import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircle, Send, Plus, Pencil, Trash2, Check, X, MoreVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string | null;
  profiles: { full_name: string | null } | null;
}

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at?: string | null;
  profiles: { full_name: string | null } | null;
  likes: { id: string; user_id: string }[];
  comments: Comment[];
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
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");
  const [editPostCategory, setEditPostCategory] = useState("general");
  const [savingPost, setSavingPost] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select("id, user_id, title, content, category, created_at, updated_at, likes(id, user_id), comments(id, user_id, content, created_at, updated_at)")
      .eq("category", activeCategory)
      .order("created_at", { ascending: false });

    const rows = (data as any[]) || [];

    const userIds = new Set<string>();
    rows.forEach((p) => {
      userIds.add(p.user_id);
      (p.comments || []).forEach((c: any) => userIds.add(c.user_id));
    });

    let nameMap: Record<string, string | null> = {};
    if (userIds.size > 0) {
      const { data: profs } = await supabase
        .from("public_user_profiles" as any)
        .select("id, full_name")
        .in("id", Array.from(userIds));
      (profs as any[] | null)?.forEach((p) => {
        nameMap[p.id] = p.full_name;
      });
    }

    const enriched: Post[] = rows.map((p) => ({
      ...p,
      profiles: { full_name: nameMap[p.user_id] ?? null },
      comments: (p.comments || [])
        .map((c: any) => ({
          ...c,
          profiles: { full_name: nameMap[c.user_id] ?? null },
        }))
        .sort((a: Comment, b: Comment) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    }));

    setPosts(enriched);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchPosts();
  }, [activeCategory]);

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
    const { error } = await supabase.from("comments").insert({ post_id: postId, user_id: user!.id, content });
    if (error) {
      toast({ variant: "destructive", title: "Couldn't post comment", description: error.message });
      return;
    }
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  const startEditComment = (c: Comment) => {
    setEditingCommentId(c.id);
    setEditingContent(c.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  const saveEditComment = async (commentId: string) => {
    const content = editingContent.trim();
    if (!content) return;
    // Optimistic UI
    setPosts((prev) =>
      prev.map((p) => ({
        ...p,
        comments: p.comments.map((c) =>
          c.id === commentId ? { ...c, content, updated_at: new Date().toISOString() } : c
        ),
      }))
    );
    const { error } = await supabase
      .from("comments")
      .update({ content })
      .eq("id", commentId)
      .eq("user_id", user!.id);
    if (error) {
      toast({ variant: "destructive", title: "Couldn't update comment", description: error.message });
      fetchPosts();
      return;
    }
    cancelEditComment();
  };

  const confirmDeleteComment = async () => {
    if (!deletingCommentId) return;
    const id = deletingCommentId;
    // Optimistic remove
    setPosts((prev) =>
      prev.map((p) => ({ ...p, comments: p.comments.filter((c) => c.id !== id) }))
    );
    setDeletingCommentId(null);
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", id)
      .eq("user_id", user!.id);
    if (error) {
      toast({ variant: "destructive", title: "Couldn't delete comment", description: error.message });
      fetchPosts();
    }
  };

  const openEditPost = (post: Post) => {
    setEditingPost(post);
    setEditPostTitle(post.title);
    setEditPostContent(post.content);
    setEditPostCategory(post.category);
  };

  const closeEditPost = () => {
    setEditingPost(null);
    setEditPostTitle("");
    setEditPostContent("");
  };

  const saveEditPost = async () => {
    if (!editingPost) return;
    const title = editPostTitle.trim();
    const content = editPostContent.trim();
    if (!title || !content) {
      toast({ variant: "destructive", title: "Title and content are required" });
      return;
    }
    if (title.length > 200) {
      toast({ variant: "destructive", title: "Title is too long", description: "Max 200 characters." });
      return;
    }
    if (content.length > 5000) {
      toast({ variant: "destructive", title: "Content is too long", description: "Max 5000 characters." });
      return;
    }
    setSavingPost(true);
    const { error } = await supabase
      .from("posts")
      .update({ title, content, category: editPostCategory })
      .eq("id", editingPost.id)
      .eq("user_id", user!.id);
    setSavingPost(false);
    if (error) {
      toast({ variant: "destructive", title: "Couldn't update post", description: error.message });
      return;
    }
    toast({ title: "Post updated" });
    // Optimistic update if category unchanged
    setPosts((prev) =>
      prev.map((p) =>
        p.id === editingPost.id
          ? { ...p, title, content, category: editPostCategory, updated_at: new Date().toISOString() }
          : p
      )
    );
    closeEditPost();
    // If category changed, the post leaves the current feed.
    if (editPostCategory !== activeCategory) fetchPosts();
  };

  const confirmDeletePost = async () => {
    if (!deletingPostId) return;
    const id = deletingPostId;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setDeletingPostId(null);
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("user_id", user!.id);
    if (error) {
      toast({ variant: "destructive", title: "Couldn't delete post", description: error.message });
      fetchPosts();
      return;
    }
    toast({ title: "Post deleted" });
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
            const isPostOwner = post.user_id === user?.id;
            const postEdited =
              post.updated_at &&
              new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 1500;
            return (
              <div key={post.id} className="rounded-lg border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{post.profiles?.full_name || "Anonymous"}</span>
                    <span>·</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    {postEdited && (
                      <>
                        <span>·</span>
                        <span className="italic text-muted-foreground/70">edited</span>
                      </>
                    )}
                  </div>
                  {isPostOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label="Post actions"
                          className="-mr-2 -mt-1 rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => openEditPost(post)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Edit post
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingPostId(post.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    {post.comments.map((c) => {
                      const isOwner = c.user_id === user?.id;
                      const isEditing = editingCommentId === c.id;
                      const edited =
                        c.updated_at &&
                        new Date(c.updated_at).getTime() - new Date(c.created_at).getTime() > 1500;
                      return (
                        <div key={c.id} className="group text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <span className="font-medium text-foreground">
                                  {c.profiles?.full_name || "Anonymous"}
                                </span>
                                <span className="text-muted-foreground">
                                  {new Date(c.created_at).toLocaleDateString()}
                                </span>
                                {edited && (
                                  <span className="italic text-muted-foreground/70">(edited)</span>
                                )}
                              </div>
                              {isEditing ? (
                                <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                                  <Textarea
                                    value={editingContent}
                                    onChange={(e) => setEditingContent(e.target.value)}
                                    rows={2}
                                    className="text-xs"
                                    autoFocus
                                  />
                                  <div className="flex gap-1 sm:flex-col">
                                    <Button
                                      size="sm"
                                      onClick={() => saveEditComment(c.id)}
                                      className="h-8 px-2"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={cancelEditComment}
                                      className="h-8 px-2"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="mt-0.5 whitespace-pre-wrap text-muted-foreground">
                                  {c.content}
                                </p>
                              )}
                            </div>
                            {isOwner && !isEditing && (
                              <div className="flex shrink-0 gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                                <button
                                  onClick={() => startEditComment(c)}
                                  aria-label="Edit comment"
                                  className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingCommentId(c.id)}
                                  aria-label="Delete comment"
                                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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

      <AlertDialog open={!!deletingCommentId} onOpenChange={(open) => !open && setDeletingCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The comment will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit post dialog */}
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && closeEditPost()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Category</Label>
              <select
                value={editPostCategory}
                onChange={(e) => setEditPostCategory(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Title</Label>
              <Input
                value={editPostTitle}
                onChange={(e) => setEditPostTitle(e.target.value)}
                maxLength={200}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={editPostContent}
                onChange={(e) => setEditPostContent(e.target.value)}
                maxLength={5000}
                rows={6}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeEditPost} disabled={savingPost}>Cancel</Button>
              <Button onClick={saveEditPost} disabled={savingPost} className="bg-primary text-primary-foreground">
                {savingPost ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete post confirmation */}
      <AlertDialog open={!!deletingPostId} onOpenChange={(open) => !open && setDeletingPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the post along with its likes and comments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePost}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
