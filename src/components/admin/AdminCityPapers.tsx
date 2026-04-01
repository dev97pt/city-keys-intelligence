import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, Upload, X } from "lucide-react";

interface Paper {
  id: string;
  title: string;
  description: string | null;
  content_markdown: string | null;
  pdf_url: string | null;
  thumbnail_url: string | null;
  country_id: string;
  city_id: string | null;
  is_published: boolean;
  premium_only: boolean;
  created_at: string;
}

interface Country { id: string; name: string; }
interface City { id: string; name: string; country_id: string; }

const empty = {
  title: "", description: "", content_markdown: "", pdf_url: "", thumbnail_url: "",
  country_id: "", city_id: "", is_published: false, premium_only: false,
};

export function AdminCityPapers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty);

  const fetchAll = async () => {
    const [{ data: p }, { data: co }, { data: ci }] = await Promise.all([
      supabase.from("city_papers").select("*").order("created_at", { ascending: false }),
      supabase.from("countries").select("id, name").order("name"),
      supabase.from("cities").select("id, name, country_id").order("name"),
    ]);
    setPapers((p as unknown as Paper[]) || []);
    setCountries(co || []);
    setCities(ci || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredCities = cities.filter(c => c.country_id === form.country_id);

  const openCreate = () => { setEditing(null); setForm(empty); setThumbnailFile(null); setThumbnailPreview(null); setOpen(true); };
  const openEdit = (p: Paper) => {
    setEditing(p.id);
    setForm({
      title: p.title, description: p.description || "", content_markdown: p.content_markdown || "",
      pdf_url: p.pdf_url || "", thumbnail_url: p.thumbnail_url || "",
      country_id: p.country_id, city_id: p.city_id || "", is_published: p.is_published, premium_only: p.premium_only,
    });
    setOpen(true);
  };

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const clearThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setForm(f => ({ ...f, thumbnail_url: "" }));
  };

  const uploadThumbnail = async (): Promise<string | null> => {
    if (!thumbnailFile) return form.thumbnail_url || null;
    const ext = thumbnailFile.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("city-paper-thumbnails").upload(path, thumbnailFile);
    if (error) throw error;
    const { data } = supabase.storage.from("city-paper-thumbnails").getPublicUrl(path);
    return data.publicUrl;
  };

  const save = async () => {
    if (!form.title || !form.country_id) {
      toast({ variant: "destructive", title: "Title and country are required" });
      return;
    }
    setUploading(true);
    let thumbnailUrl = form.thumbnail_url || null;
    try {
      thumbnailUrl = await uploadThumbnail();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
      setUploading(false);
      return;
    }
    const payload: any = {
      title: form.title,
      description: form.description || null,
      content_markdown: form.content_markdown || null,
      pdf_url: form.pdf_url || null,
      thumbnail_url: thumbnailUrl,
      country_id: form.country_id,
      city_id: form.city_id || null,
      is_published: form.is_published,
      premium_only: form.premium_only,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("city_papers").update(payload).eq("id", editing));
    } else {
      payload.created_by = user?.id;
      ({ error } = await supabase.from("city_papers").insert(payload));
    }
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: editing ? "Paper updated" : "Paper created" });
      setOpen(false);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      fetchAll();
    }
    setUploading(false);
  };

  const deletePaper = async (id: string) => {
    const { error } = await supabase.from("city_papers").delete().eq("id", id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Paper deleted" }); fetchAll(); }
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from("city_papers").update({ is_published: !current } as any).eq("id", id);
    toast({ title: !current ? "Published" : "Unpublished" });
    fetchAll();
  };

  const countryName = (id: string) => countries.find(c => c.id === id)?.name || "—";
  const cityName = (id: string | null) => id ? cities.find(c => c.id === id)?.name || "" : "";

  const filtered = papers.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.title.toLowerCase().includes(s) || countryName(p.country_id).toLowerCase().includes(s);
  });

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search papers…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Paper
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">No city papers found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Created</th>
                <th className="px-4 py-3 w-40"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-card/50">
                  <td className="px-4 py-3 font-medium text-foreground text-xs">{p.title}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {countryName(p.country_id)}{cityName(p.city_id) ? ` · ${cityName(p.city_id)}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-[10px] ${p.is_published
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}`}>
                      {p.is_published ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => togglePublish(p.id, p.is_published)}>
                        {p.is_published ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(p)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => deletePaper(p.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing ? "Edit Paper" : "New City Paper"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Country *</Label>
                <Select value={form.country_id} onValueChange={v => setForm(f => ({ ...f, country_id: v, city_id: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {countries.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>City</Label>
                <Select value={form.city_id} onValueChange={v => setForm(f => ({ ...f, city_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent>
                    {filteredCities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Content (Markdown)</Label>
              <Textarea value={form.content_markdown} onChange={e => setForm(f => ({ ...f, content_markdown: e.target.value }))} rows={10} className="font-mono text-xs" />
            </div>
            <div>
              <Label>Thumbnail URL</Label>
              <Input value={form.thumbnail_url} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <Label>PDF URL (optional)</Label>
              <Input value={form.pdf_url} onChange={e => setForm(f => ({ ...f, pdf_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
                <Label>Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.premium_only} onCheckedChange={v => setForm(f => ({ ...f, premium_only: v }))} />
                <Label>Premium Only</Label>
              </div>
            </div>
            <Button onClick={save} className="w-full">{editing ? "Save Changes" : "Create Paper"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
