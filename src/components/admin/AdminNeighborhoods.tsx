import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X, Sparkles, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Neighborhood {
  id: string; name: string; city: string; region: string; country: string;
  price_per_m2: number | null; yield: number | null; safety_score: number | null;
  transport_score: number | null; lifestyle_score: number | null;
  investment_score: number | null; vibe: string | null; risk_level: string | null;
  distance_to_center: string | null; is_published: boolean;
}

interface Details {
  neighborhood_id: string;
  story_intro: string; price_level: string; tourist_density: string;
  green_areas: string; coworking_density: string; expat_popularity: string;
  transport_quality: string; metro_access: boolean;
  parks: string[]; markets: string[]; hospitals: string[];
  coworking_spaces: string[]; metro_lines: string[]; train_stations: string[];
  bus_stations: string[]; beach_access: boolean; bike_lanes: boolean;
  avg_price: number | null; price_growth: number | null; city_avg_price: number | null;
  ideal_for: string[]; not_ideal_for: string[];
  pros: string[]; cons: string[];
  kttc_insight: string; ai_story: string;
}

const emptyNeighborhood: Omit<Neighborhood, "id"> = {
  name: "", city: "", region: "Lisbon Region", country: "Portugal",
  price_per_m2: null, yield: null, safety_score: null, transport_score: null,
  lifestyle_score: null, investment_score: null, vibe: "", risk_level: "Medium",
  distance_to_center: "", is_published: false,
};

const emptyDetails: Omit<Details, "neighborhood_id"> = {
  story_intro: "", price_level: "", tourist_density: "", green_areas: "",
  coworking_density: "", expat_popularity: "", transport_quality: "",
  metro_access: false, parks: [], markets: [], hospitals: [], coworking_spaces: [],
  metro_lines: [], train_stations: [], bus_stations: [],
  beach_access: false, bike_lanes: false,
  avg_price: null, price_growth: null, city_avg_price: null,
  ideal_for: [], not_ideal_for: [], pros: [], cons: [],
  kttc_insight: "", ai_story: "",
};

function ArrayField({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex gap-2 mt-1">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Add ${label.toLowerCase()}...`} className="text-sm" />
        <Button size="sm" variant="outline" onClick={() => { if (input.trim()) { onChange([...value, input.trim()]); setInput(""); } }}>+</Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {value.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-foreground">
            {v}
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminNeighborhoods() {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [editItem, setEditItem] = useState<Partial<Neighborhood> | null>(null);
  const [editDetails, setEditDetails] = useState<Partial<Details> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingStory, setGeneratingStory] = useState(false);

  const load = () => {
    supabase.from("neighborhoods").select("*").order("region").order("name").then(({ data }) => {
      setNeighborhoods((data as unknown as Neighborhood[]) || []);
    });
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditItem({ ...emptyNeighborhood });
    setEditDetails({ ...emptyDetails });
    setIsNew(true);
    setDialogOpen(true);
  };

  const openEdit = async (n: Neighborhood) => {
    setEditItem(n);
    const { data } = await supabase.from("neighborhood_details").select("*").eq("neighborhood_id", n.id).single();
    if (data) {
      const d = data as any;
      setEditDetails({
        ...d,
        parks: d.parks || [], markets: d.markets || [], hospitals: d.hospitals || [],
        coworking_spaces: d.coworking_spaces || [], metro_lines: d.metro_lines || [],
        train_stations: d.train_stations || [], bus_stations: d.bus_stations || [],
        ideal_for: d.ideal_for || [], not_ideal_for: d.not_ideal_for || [],
        pros: d.pros || [], cons: d.cons || [],
      });
    } else {
      setEditDetails({ ...emptyDetails });
    }
    setIsNew(false);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!editItem?.name || !editItem?.city || !editItem?.region) {
      toast.error("Name, city, and region are required.");
      return;
    }
    setSaving(true);
    try {
      let neighborhoodId: string;
      if (isNew) {
        const { data, error } = await supabase.from("neighborhoods").insert({
          name: editItem.name, city: editItem.city, region: editItem.region,
          country: editItem.country || "Portugal",
          price_per_m2: editItem.price_per_m2, yield: editItem.yield,
          safety_score: editItem.safety_score, transport_score: editItem.transport_score,
          lifestyle_score: editItem.lifestyle_score, investment_score: editItem.investment_score,
          vibe: editItem.vibe, risk_level: editItem.risk_level,
          distance_to_center: editItem.distance_to_center, is_published: editItem.is_published || false,
        } as any).select("id").single();
        if (error) throw error;
        neighborhoodId = data.id;
      } else {
        neighborhoodId = (editItem as Neighborhood).id;
        const { error } = await supabase.from("neighborhoods").update({
          name: editItem.name, city: editItem.city, region: editItem.region,
          country: editItem.country,
          price_per_m2: editItem.price_per_m2, yield: editItem.yield,
          safety_score: editItem.safety_score, transport_score: editItem.transport_score,
          lifestyle_score: editItem.lifestyle_score, investment_score: editItem.investment_score,
          vibe: editItem.vibe, risk_level: editItem.risk_level,
          distance_to_center: editItem.distance_to_center, is_published: editItem.is_published,
        } as any).eq("id", neighborhoodId);
        if (error) throw error;
      }

      // Upsert details
      if (editDetails) {
        const detailPayload = {
          neighborhood_id: neighborhoodId,
          story_intro: editDetails.story_intro || "",
          price_level: editDetails.price_level || "",
          tourist_density: editDetails.tourist_density || "",
          green_areas: editDetails.green_areas || "",
          coworking_density: editDetails.coworking_density || "",
          expat_popularity: editDetails.expat_popularity || "",
          transport_quality: editDetails.transport_quality || "",
          metro_access: editDetails.metro_access || false,
          parks: editDetails.parks || [],
          markets: editDetails.markets || [],
          hospitals: editDetails.hospitals || [],
          coworking_spaces: editDetails.coworking_spaces || [],
          metro_lines: editDetails.metro_lines || [],
          train_stations: editDetails.train_stations || [],
          bus_stations: editDetails.bus_stations || [],
          beach_access: editDetails.beach_access || false,
          bike_lanes: editDetails.bike_lanes || false,
          avg_price: editDetails.avg_price,
          price_growth: editDetails.price_growth,
          city_avg_price: editDetails.city_avg_price,
          ideal_for: editDetails.ideal_for || [],
          not_ideal_for: editDetails.not_ideal_for || [],
          pros: editDetails.pros || [],
          cons: editDetails.cons || [],
          kttc_insight: editDetails.kttc_insight || "",
          ai_story: editDetails.ai_story || "",
        };
        await supabase.from("neighborhood_details").upsert(detailPayload as any, { onConflict: "neighborhood_id" });
      }

      toast.success(isNew ? "Neighborhood created" : "Neighborhood updated");
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this neighborhood?")) return;
    await supabase.from("neighborhoods").delete().eq("id", id);
    toast.success("Deleted");
    load();
  };

  const generateStory = async () => {
    if (!editItem?.name) return;
    setGeneratingStory(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Write a compelling, conversational neighborhood story for "${editItem.name}" in ${editItem.city}, ${editItem.region}, Portugal. 
Include: what makes this area special, the vibe, lifestyle, investment potential. 
Data: Price/m² ${editItem.price_per_m2 || "N/A"}, Yield ${editItem.yield || "N/A"}%, Safety ${editItem.safety_score || "N/A"}/10, Lifestyle ${editItem.lifestyle_score || "N/A"}/10.
Vibe: ${editItem.vibe || "N/A"}.
Keep it 150-200 words, warm, insightful tone. No headers or bullet points.`
          }]
        },
      });
      if (error) throw error;
      const story = data?.choices?.[0]?.message?.content || data?.message || "";
      setEditDetails((prev) => ({ ...prev, ai_story: story }));
      toast.success("Story generated!");
    } catch (e: any) {
      toast.error("Failed to generate story: " + e.message);
    } finally {
      setGeneratingStory(false);
    }
  };

  const n = (v: any) => (v === "" || v === undefined ? null : Number(v));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl font-semibold text-foreground">Neighborhoods</h2>
        <Button size="sm" onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Add Neighborhood</Button>
      </div>

      <div className="space-y-2">
        {neighborhoods.map((nb) => (
          <div key={nb.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <span className="text-sm font-medium text-foreground">{nb.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{nb.city}, {nb.region}</span>
              {!nb.is_published && <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">Draft</span>}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEdit(nb)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => remove(nb.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        {neighborhoods.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No neighborhoods yet. Add the first one.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">{isNew ? "Create Neighborhood" : "Edit Neighborhood"}</DialogTitle>
          </DialogHeader>

          {editItem && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Basic Info</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Name *</label>
                    <Input value={editItem.name || ""} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">City *</label>
                    <Input value={editItem.city || ""} onChange={(e) => setEditItem({ ...editItem, city: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Region *</label>
                    <Input value={editItem.region || ""} onChange={(e) => setEditItem({ ...editItem, region: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Vibe</label>
                    <Input value={editItem.vibe || ""} onChange={(e) => setEditItem({ ...editItem, vibe: e.target.value })} placeholder="e.g. Trendy, Up-and-coming" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Risk Level</label>
                    <Input value={editItem.risk_level || ""} onChange={(e) => setEditItem({ ...editItem, risk_level: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Distance to Center</label>
                    <Input value={editItem.distance_to_center || ""} onChange={(e) => setEditItem({ ...editItem, distance_to_center: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editItem.is_published || false} onCheckedChange={(v) => setEditItem({ ...editItem, is_published: v })} />
                  <span className="text-sm text-foreground">Published</span>
                </div>
              </div>

              {/* Scores */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Scores & Metrics</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Price/m²</label>
                    <Input type="number" value={editItem.price_per_m2 ?? ""} onChange={(e) => setEditItem({ ...editItem, price_per_m2: n(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Yield %</label>
                    <Input type="number" step="0.1" value={editItem.yield ?? ""} onChange={(e) => setEditItem({ ...editItem, yield: n(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Safety (0-10)</label>
                    <Input type="number" step="0.1" value={editItem.safety_score ?? ""} onChange={(e) => setEditItem({ ...editItem, safety_score: n(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Transport (0-10)</label>
                    <Input type="number" step="0.1" value={editItem.transport_score ?? ""} onChange={(e) => setEditItem({ ...editItem, transport_score: n(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Lifestyle (0-10)</label>
                    <Input type="number" step="0.1" value={editItem.lifestyle_score ?? ""} onChange={(e) => setEditItem({ ...editItem, lifestyle_score: n(e.target.value) })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Investment (0-10)</label>
                    <Input type="number" step="0.1" value={editItem.investment_score ?? ""} onChange={(e) => setEditItem({ ...editItem, investment_score: n(e.target.value) })} />
                  </div>
                </div>
              </div>

              {/* Details */}
              {editDetails && (
                <>
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Story & Insights</h3>
                    <div>
                      <label className="text-xs text-muted-foreground">Story Intro (manual)</label>
                      <Textarea value={editDetails.story_intro || ""} onChange={(e) => setEditDetails({ ...editDetails, story_intro: e.target.value })} rows={4} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-muted-foreground">AI Generated Story</label>
                        <Button variant="outline" size="sm" onClick={generateStory} disabled={generatingStory}>
                          {generatingStory ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                          Generate
                        </Button>
                      </div>
                      <Textarea value={editDetails.ai_story || ""} onChange={(e) => setEditDetails({ ...editDetails, ai_story: e.target.value })} rows={4} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">KTTC Insight</label>
                      <Textarea value={editDetails.kttc_insight || ""} onChange={(e) => setEditDetails({ ...editDetails, kttc_insight: e.target.value })} rows={3} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Quick Insights</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs text-muted-foreground">Price Level</label><Input value={editDetails.price_level || ""} onChange={(e) => setEditDetails({ ...editDetails, price_level: e.target.value })} placeholder="e.g. Medium" /></div>
                      <div><label className="text-xs text-muted-foreground">Tourist Density</label><Input value={editDetails.tourist_density || ""} onChange={(e) => setEditDetails({ ...editDetails, tourist_density: e.target.value })} /></div>
                      <div><label className="text-xs text-muted-foreground">Green Areas</label><Input value={editDetails.green_areas || ""} onChange={(e) => setEditDetails({ ...editDetails, green_areas: e.target.value })} /></div>
                      <div><label className="text-xs text-muted-foreground">Coworking Density</label><Input value={editDetails.coworking_density || ""} onChange={(e) => setEditDetails({ ...editDetails, coworking_density: e.target.value })} /></div>
                      <div><label className="text-xs text-muted-foreground">Expat Popularity</label><Input value={editDetails.expat_popularity || ""} onChange={(e) => setEditDetails({ ...editDetails, expat_popularity: e.target.value })} /></div>
                      <div><label className="text-xs text-muted-foreground">Transport Quality</label><Input value={editDetails.transport_quality || ""} onChange={(e) => setEditDetails({ ...editDetails, transport_quality: e.target.value })} /></div>
                    </div>
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2"><Switch checked={editDetails.metro_access || false} onCheckedChange={(v) => setEditDetails({ ...editDetails, metro_access: v })} /><span className="text-xs">Metro Access</span></div>
                      <div className="flex items-center gap-2"><Switch checked={editDetails.beach_access || false} onCheckedChange={(v) => setEditDetails({ ...editDetails, beach_access: v })} /><span className="text-xs">Beach Access</span></div>
                      <div className="flex items-center gap-2"><Switch checked={editDetails.bike_lanes || false} onCheckedChange={(v) => setEditDetails({ ...editDetails, bike_lanes: v })} /><span className="text-xs">Bike Lanes</span></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Real Estate</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="text-xs text-muted-foreground">Avg Price/m²</label><Input type="number" value={editDetails.avg_price ?? ""} onChange={(e) => setEditDetails({ ...editDetails, avg_price: n(e.target.value) })} /></div>
                      <div><label className="text-xs text-muted-foreground">Price Growth %</label><Input type="number" step="0.1" value={editDetails.price_growth ?? ""} onChange={(e) => setEditDetails({ ...editDetails, price_growth: n(e.target.value) })} /></div>
                      <div><label className="text-xs text-muted-foreground">City Avg Price</label><Input type="number" value={editDetails.city_avg_price ?? ""} onChange={(e) => setEditDetails({ ...editDetails, city_avg_price: n(e.target.value) })} /></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Infrastructure</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <ArrayField label="Parks" value={editDetails.parks || []} onChange={(v) => setEditDetails({ ...editDetails, parks: v })} />
                      <ArrayField label="Markets" value={editDetails.markets || []} onChange={(v) => setEditDetails({ ...editDetails, markets: v })} />
                      <ArrayField label="Hospitals" value={editDetails.hospitals || []} onChange={(v) => setEditDetails({ ...editDetails, hospitals: v })} />
                      <ArrayField label="Coworking Spaces" value={editDetails.coworking_spaces || []} onChange={(v) => setEditDetails({ ...editDetails, coworking_spaces: v })} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Transport</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <ArrayField label="Metro Lines" value={editDetails.metro_lines || []} onChange={(v) => setEditDetails({ ...editDetails, metro_lines: v })} />
                      <ArrayField label="Train Stations" value={editDetails.train_stations || []} onChange={(v) => setEditDetails({ ...editDetails, train_stations: v })} />
                      <ArrayField label="Bus Stations" value={editDetails.bus_stations || []} onChange={(v) => setEditDetails({ ...editDetails, bus_stations: v })} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Buyer Profiles</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <ArrayField label="Ideal For" value={editDetails.ideal_for || []} onChange={(v) => setEditDetails({ ...editDetails, ideal_for: v })} />
                      <ArrayField label="Not Ideal For" value={editDetails.not_ideal_for || []} onChange={(v) => setEditDetails({ ...editDetails, not_ideal_for: v })} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Pros & Cons</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <ArrayField label="Pros" value={editDetails.pros || []} onChange={(v) => setEditDetails({ ...editDetails, pros: v })} />
                      <ArrayField label="Cons" value={editDetails.cons || []} onChange={(v) => setEditDetails({ ...editDetails, cons: v })} />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setDialogOpen(false)}><X className="mr-1 h-4 w-4" /> Cancel</Button>
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                  {isNew ? "Create" : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
