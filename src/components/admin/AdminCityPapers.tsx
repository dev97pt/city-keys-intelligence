import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Search, Eye, EyeOff, Upload, X, Loader2, FileText } from "lucide-react";
import { extractPdfMeta, ExtractedPdfMeta } from "@/lib/pdfExtract";

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

export function AdminCityPapers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  // Upload flow state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [meta, setMeta] = useState<ExtractedPdfMeta | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dictionary of known locations (city + country names) loaded once and
  // passed to the PDF extractor so we can detect locations accurately from
  // the document's first page text.
  const [locationDict, setLocationDict] = useState<string[]>([]);

  const fetchPapers = async () => {
    const { data } = await supabase
      .from("city_papers")
      .select("id, title, description, pdf_path, thumbnail_url, is_published, premium_only, created_at")
      .order("created_at", { ascending: false });
    setPapers((data as Paper[]) || []);
    setLoading(false);
  };

  const fetchLocationDictionary = async () => {
    const [{ data: cities }, { data: countries }] = await Promise.all([
      supabase.from("cities").select("name"),
      supabase.from("countries").select("name"),
    ]);
    const names = [
      ...(cities || []).map((c: any) => c.name),
      ...(countries || []).map((c: any) => c.name),
    ].filter(Boolean);
    setLocationDict(names);
  };

  useEffect(() => { fetchPapers(); fetchLocationDictionary(); }, []);


  const resetForm = () => {
    if (meta?.thumbnailUrl) URL.revokeObjectURL(meta.thumbnailUrl);
    setPdfFile(null);
    setMeta(null);
    setIsPublished(true);
    setPremiumOnly(false);
  };

  const openCreate = () => { resetForm(); setOpen(true); };

  const handleFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ variant: "destructive", title: "PDF files only" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Max 50 MB." });
      return;
    }
    setPdfFile(file);
    setParsing(true);
    try {
      const m = await extractPdfMeta(file, { locationDictionary: locationDict });
      setMeta(m);

    } catch (err: any) {
      toast({ variant: "destructive", title: "Could not read PDF", description: err.message });
      setPdfFile(null);
    } finally {
      setParsing(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const create = async () => {
    if (!pdfFile || !meta) return;
    setSaving(true);
    try {
      const pdfPath = `${crypto.randomUUID()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("city-papers")
        .upload(pdfPath, pdfFile, { contentType: "application/pdf" });
      if (upErr) throw upErr;

      const thumbName = `${crypto.randomUUID()}.jpg`;
      const { error: thErr } = await supabase.storage
        .from("city-paper-thumbnails")
        .upload(thumbName, meta.thumbnailBlob, { contentType: "image/jpeg" });
      if (thErr) throw thErr;
      const { data: thUrl } = supabase.storage.from("city-paper-thumbnails").getPublicUrl(thumbName);

      const { error: insErr } = await supabase.from("city_papers").insert({
        title: meta.title,
        description: meta.description || null,
        pdf_path: pdfPath,
        thumbnail_url: thUrl.publicUrl,
        is_published: isPublished,
        premium_only: premiumOnly,
        created_by: user?.id,
        // Use the PDF's own publication date if we extracted one — so the
        // displayed date reflects the document, not the upload time.
        ...(meta.publicationDate ? { created_at: meta.publicationDate } : {}),
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
            {!meta && !parsing && (
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
            )}

            {parsing && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border p-10 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Reading document…</span>
              </div>
            )}

            {meta && pdfFile && (
              <>
                <div className="flex gap-4 rounded-xl border border-border bg-secondary/30 p-3">
                  <img src={meta.thumbnailUrl} alt="" className="h-32 w-24 object-cover rounded-md border border-border shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium text-foreground line-clamp-2">{meta.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {meta.pageCount} pages · {(pdfFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    {meta.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3 pt-1">{meta.description}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={resetForm}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="pub" className="text-sm">Published</Label>
                  <Switch id="pub" checked={isPublished} onCheckedChange={setIsPublished} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="prem" className="text-sm">Premium Only</Label>
                  <Switch id="prem" checked={premiumOnly} onCheckedChange={setPremiumOnly} />
                </div>

                <Button onClick={create} className="w-full" disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publishing…</> : "Create Paper"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
