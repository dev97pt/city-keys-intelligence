import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Heart, MapPin, DollarSign, Users, TreePine, Briefcase, Globe,
  Train, Bus, Bike, Waves, Building, ShoppingCart, Stethoscope, TrendingUp,
  CheckCircle2, XCircle, Lightbulb, Shield, Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface Neighborhood {
  id: string; name: string; city: string; region: string; country: string;
  price_per_m2: number | null; yield: number | null; safety_score: number | null;
  transport_score: number | null; lifestyle_score: number | null;
  investment_score: number | null; vibe: string | null; risk_level: string | null;
  distance_to_center: string | null;
}

interface Details {
  story_intro: string | null; price_level: string | null; tourist_density: string | null;
  green_areas: string | null; coworking_density: string | null; expat_popularity: string | null;
  transport_quality: string | null; metro_access: boolean; parks: string[]; markets: string[];
  hospitals: string[]; coworking_spaces: string[]; metro_lines: string[]; train_stations: string[];
  bus_stations: string[]; beach_access: boolean; bike_lanes: boolean;
  avg_price: number | null; price_growth: number | null; city_avg_price: number | null;
  ideal_for: string[]; not_ideal_for: string[]; pros: string[]; cons: string[];
  kttc_insight: string | null; ai_story: string | null;
}

function InsightCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ListSection({ icon: Icon, title, items }: { icon: any; title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function NeighborhoodStory() {
  const { neighborhoodId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [n, setN] = useState<Neighborhood | null>(null);
  const [details, setDetails] = useState<Details | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!neighborhoodId) return;
    Promise.all([
      supabase.from("neighborhoods").select("*").eq("id", neighborhoodId).single(),
      supabase.from("neighborhood_details").select("*").eq("neighborhood_id", neighborhoodId).single(),
      user ? supabase.from("user_shortlists").select("id").eq("user_id", user.id).eq("neighborhood_id", neighborhoodId) : Promise.resolve({ data: [] }),
    ]).then(([nRes, dRes, sRes]) => {
      if (nRes.data) setN(nRes.data as unknown as Neighborhood);
      if (dRes.data) {
        const d = dRes.data as any;
        setDetails({
          ...d,
          parks: d.parks || [], markets: d.markets || [], hospitals: d.hospitals || [],
          coworking_spaces: d.coworking_spaces || [], metro_lines: d.metro_lines || [],
          train_stations: d.train_stations || [], bus_stations: d.bus_stations || [],
          ideal_for: d.ideal_for || [], not_ideal_for: d.not_ideal_for || [],
          pros: d.pros || [], cons: d.cons || [],
        });
      }
      setIsSaved((sRes as any)?.data?.length > 0);
      setLoading(false);
    });
  }, [neighborhoodId, user]);

  const toggleSave = async () => {
    if (!user || !neighborhoodId) return;
    if (isSaved) {
      await supabase.from("user_shortlists").delete().eq("user_id", user.id).eq("neighborhood_id", neighborhoodId);
      setIsSaved(false);
      toast.success("Removed from shortlist");
    } else {
      await supabase.from("user_shortlists").insert({ user_id: user.id, neighborhood_id: neighborhoodId });
      setIsSaved(true);
      toast.success("Added to shortlist");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!n) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Neighborhood not found.</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const d = details;

  return (
    <div className="mx-auto max-w-4xl pb-16">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 text-muted-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Results
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary mb-2">Neighborhood Intelligence</p>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground">{n.name}</h1>
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {n.city}, {n.region} • {n.country}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={toggleSave} className={isSaved ? "border-primary text-primary" : ""}>
            <Heart className={`mr-1 h-4 w-4 ${isSaved ? "fill-primary" : ""}`} />
            {isSaved ? "Saved" : "Save"}
          </Button>
        </div>

        {n.vibe && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">{n.vibe}</span>
            {n.risk_level && (
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">Risk: {n.risk_level}</span>
            )}
          </div>
        )}
      </div>

      {/* Story Intro */}
      {(d?.story_intro || d?.ai_story) && (
        <div className="mb-10 rounded-xl border border-border bg-card p-6 md:p-8">
          <p className="font-serif text-lg leading-relaxed text-foreground/90">
            {d.story_intro || d.ai_story}
          </p>
        </div>
      )}

      {/* Quick Insights Grid */}
      <div className="mb-10">
        <h3 className="mb-4 font-serif text-lg font-semibold text-foreground">Quick Insights</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {d?.price_level && <InsightCard icon={DollarSign} label="Price Level" value={d.price_level} />}
          {d?.tourist_density && <InsightCard icon={Globe} label="Tourist Density" value={d.tourist_density} />}
          {d?.green_areas && <InsightCard icon={TreePine} label="Green Areas" value={d.green_areas} />}
          {d?.coworking_density && <InsightCard icon={Briefcase} label="Coworking" value={d.coworking_density} />}
          {d?.expat_popularity && <InsightCard icon={Users} label="Expat Popularity" value={d.expat_popularity} />}
          {n.distance_to_center && <InsightCard icon={MapPin} label="Distance to Center" value={n.distance_to_center} />}
          {d?.transport_quality && <InsightCard icon={Train} label="Transport" value={d.transport_quality} />}
          {d?.metro_access && <InsightCard icon={Train} label="Metro Access" value="Yes" />}
        </div>
      </div>

      {/* Key Scores */}
      <div className="mb-10">
        <h3 className="mb-4 font-serif text-lg font-semibold text-foreground">Scores</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Safety", score: n.safety_score, icon: Shield },
            { label: "Transport", score: n.transport_score, icon: Train },
            { label: "Lifestyle", score: n.lifestyle_score, icon: Sparkles },
            { label: "Investment", score: n.investment_score, icon: TrendingUp },
          ].map((s) =>
            s.score ? (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
                <s.icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`mt-1 text-xl font-bold font-mono ${s.score >= 7 ? "text-green-400" : s.score >= 5 ? "text-primary" : "text-red-400"}`}>
                  {s.score}/10
                </p>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Infrastructure */}
      {d && (
        <div className="mb-10 space-y-6">
          <h3 className="font-serif text-lg font-semibold text-foreground">Infrastructure</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <ListSection icon={TreePine} title="Parks & Green Spaces" items={d.parks} />
            <ListSection icon={ShoppingCart} title="Markets & Shopping" items={d.markets} />
            <ListSection icon={Stethoscope} title="Hospitals & Clinics" items={d.hospitals} />
            <ListSection icon={Briefcase} title="Coworking Spaces" items={d.coworking_spaces} />
          </div>
        </div>
      )}

      {/* Transport */}
      {d && (
        <div className="mb-10 space-y-6">
          <h3 className="font-serif text-lg font-semibold text-foreground">Transport</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <ListSection icon={Train} title="Metro Lines" items={d.metro_lines} />
            <ListSection icon={Train} title="Train Stations" items={d.train_stations} />
            <ListSection icon={Bus} title="Bus Stations" items={d.bus_stations} />
          </div>
          <div className="flex flex-wrap gap-3">
            {d.beach_access && (
              <span className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground">
                <Waves className="h-3.5 w-3.5 text-primary" /> Beach Access
              </span>
            )}
            {d.bike_lanes && (
              <span className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground">
                <Bike className="h-3.5 w-3.5 text-primary" /> Bike Lanes
              </span>
            )}
          </div>
        </div>
      )}

      {/* Real Estate Data */}
      {d && (d.avg_price || d.price_growth) && (
        <div className="mb-10">
          <h3 className="mb-4 font-serif text-lg font-semibold text-foreground">Real Estate Data</h3>
          <div className="grid grid-cols-3 gap-3">
            {d.avg_price && (
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-xs text-muted-foreground">Avg. Price/m²</p>
                <p className="mt-1 font-mono text-lg font-bold text-foreground">€{d.avg_price.toLocaleString()}</p>
              </div>
            )}
            {d.price_growth && (
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-xs text-muted-foreground">Price Growth</p>
                <p className={`mt-1 font-mono text-lg font-bold ${d.price_growth >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {d.price_growth > 0 ? "+" : ""}{d.price_growth}%
                </p>
              </div>
            )}
            {d.city_avg_price && (
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-xs text-muted-foreground">City Average</p>
                <p className="mt-1 font-mono text-lg font-bold text-muted-foreground">€{d.city_avg_price.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Who This Is For */}
      {d && (d.ideal_for.length > 0 || d.not_ideal_for.length > 0) && (
        <div className="mb-10 grid gap-4 md:grid-cols-2">
          {d.ideal_for.length > 0 && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-400">
                <CheckCircle2 className="h-4 w-4" /> Ideal For
              </h4>
              <ul className="space-y-2">
                {d.ideal_for.map((item, i) => (
                  <li key={i} className="text-sm text-foreground/80">• {item}</li>
                ))}
              </ul>
            </div>
          )}
          {d.not_ideal_for.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-400">
                <XCircle className="h-4 w-4" /> Not Ideal For
              </h4>
              <ul className="space-y-2">
                {d.not_ideal_for.map((item, i) => (
                  <li key={i} className="text-sm text-foreground/80">• {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Pros & Cons */}
      {d && (d.pros.length > 0 || d.cons.length > 0) && (
        <div className="mb-10 grid gap-4 md:grid-cols-2">
          {d.pros.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-400">
                <CheckCircle2 className="h-4 w-4" /> Pros
              </h4>
              <ul className="space-y-2">
                {d.pros.map((item, i) => (
                  <li key={i} className="text-sm text-foreground/80">✓ {item}</li>
                ))}
              </ul>
            </div>
          )}
          {d.cons.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-400">
                <XCircle className="h-4 w-4" /> Cons
              </h4>
              <ul className="space-y-2">
                {d.cons.map((item, i) => (
                  <li key={i} className="text-sm text-foreground/80">✗ {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* KTTC Insight */}
      {d?.kttc_insight && (
        <div className="mb-10 rounded-xl border border-primary/30 bg-primary/5 p-6">
          <h4 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold text-primary">
            <Lightbulb className="h-5 w-5" /> KTTC Insight
          </h4>
          <p className="text-sm leading-relaxed text-foreground/90">{d.kttc_insight}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Results
        </Button>
        <Button onClick={toggleSave} className={isSaved ? "bg-primary/20 text-primary border border-primary" : ""}>
          <Heart className={`mr-1 h-4 w-4 ${isSaved ? "fill-primary" : ""}`} />
          {isSaved ? "Saved" : "Save to Shortlist"}
        </Button>
      </div>
    </div>
  );
}
