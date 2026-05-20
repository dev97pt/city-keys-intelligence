import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Search, Eye, EyeOff, Upload, X, Loader2, FileText } from "lucide-react";

interface Paper {
  id: string;
  title: string;
  description: string | null;
  pdf_path: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  premium_only: boolean;
  created_at: string;
}

interface Country { id: string; name: string }
interface City { id: string; name: string; country_id: string }

export function AdminCityPapers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  // Upload flow state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [countryId, setCountryId] = useState<string>("");
  const [cityId, setCityId] = useState<string>("");
  const [publicationDate, setPublicationDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [isPublished, setIsPublished] = useState(true);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const fetchPapers = async () => {
    const { data } = await supabase
      .from("city_papers")
      .select("id, title, description, pdf_path, thumbnail_url, is_published, premium_only, created_at")
      .order("created_at", { ascending: false });
    setPapers((data as Paper[]) || []);
    setLoading(false);
  };

  const fetchLocations = async () => {
    const [{ data: cs }, { data: cts }] = await Promise.all([
      supabase.from("countries").select("id, name").order("name"),
      supabase.from("cities").select("id, name, country_id").order("name"),
    ]);
    setCountries((cs as Country[]) || []);
    setCities((cts as City[]) || []);
  };

  useEffect(() => { fetchPapers(); fetchLocations(); }, []);

  const filteredCities = useMemo(
    () => cities.filter((c) => !countryId || c.country_id === countryId),
    [cities, countryId],
  );

  const resetForm = () => {
    setPdfFile(null);
    setTitle("");
    setCountryId("");
    setCityId("");
    setPublicationDate(new Date().toISOString().slice(0, 10));
    setIsPublished(true);
    setPremiumOnly(false);
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const handleFile = (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ variant: "destructive", title: "PDF files only" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Max 50 MB." });
      return;
    }
    setPdfFile(file);
    if (!title) {
      // Pre-fill title from filename (without extension) as a friendly default.
      setTitle(file.name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").trim());
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const create = async () => {
    if (!pdfFile) {
      toast({ variant: "destructive", title: "Please upload a PDF" });
      return;
    }
    if (!title.trim()) {
      toast({ variant: "destructive", title: "Please enter a title" });
      return;
    }
    setSaving(true);
    try {
      const pdfPath = `${crypto.randomUUID()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("city-papers")
        .upload(pdfPath, pdfFile, { contentType: "application/pdf" });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("city_papers").insert({
        title: title.trim(),
        pdf_path: pdfPath,
        is_published: isPublished,
        premium_only: premiumOnly,
        created_by: user?.id,
        country_id: countryId || null,
        city_id: cityId || null,
        created_at: new Date(publicationDate).toISOString(),
      } as any);

      if (insErr) throw insErr;

      toast({ title: "Paper published" });
      setOpen(false);
      resetForm();
      fetchPapers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Upload failed", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const deletePaper = async (p: Paper) => {
    if (p.pdf_path) await supabase.storage.from("city-papers").remove([p.pdf_path]);
    const { error } = await supabase.from("city_papers").delete().eq("id", p.id);
    if (error) toast({ variant: "destructive", title: "Error", description: error.message });
    else { toast({ title: "Paper deleted" }); fetchPapers(); }
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from("city_papers").update({ is_published: !current } as any).eq("id", id);
    fetchPapers();
  };

  const filtered = papers.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
        <p className="text-center text-sm text-muted-foreground py-12">No city papers yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="group rounded-xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-colors">
              <div className="aspect-[4/3] bg-secondary overflow-hidden">
                {p.thumbnail_url ? (
                  <img src={p.thumbnail_url} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium text-foreground line-clamp-2 flex-1">{p.title}</h3>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${p.is_published
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}`}>
                    {p.is_published ? "Live" : "Draft"}
                  </Badge>
                </div>
                <div className="flex gap-1 pt-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={() => togglePublish(p.id, p.is_published)}>
                    {p.is_published ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                    {p.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deletePaper(p)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif">New City Paper</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {!pdfFile ? (
              <label
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-10 cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-all"
              >
                <Upload className="h-10 w-10 text-primary/70 mb-3" />
                <span className="text-sm text-foreground font-medium">Drop your PDF here</span>
                <span className="text-xs text-muted-foreground mt-1">or click to browse · max 50 MB</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 p-3">
                <FileText className="h-8 w-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{pdfFile.name}</p>
                  <p className="text-[11px] text-muted-foreground">{(pdfFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => setPdfFile(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Marvila Deep Dive" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Country</Label>
                <Select value={countryId} onValueChange={(v) => { setCountryId(v); setCityId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">City</Label>
                <Select value={cityId} onValueChange={setCityId} disabled={!countryId}>
                  <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent>
                    {filteredCities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm">Publication Date</Label>
              <Input id="date" type="date" value={publicationDate} onChange={(e) => setPublicationDate(e.target.value)} />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="pub" className="text-sm">Published</Label>
              <Switch id="pub" checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="prem" className="text-sm">Premium Only</Label>
              <Switch id="prem" checked={premiumOnly} onCheckedChange={setPremiumOnly} />
            </div>

            <Button onClick={create} className="w-full" disabled={saving || !pdfFile}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publishing…</> : "Create Paper"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
