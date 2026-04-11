import { Heart, ArrowRight, TrendingUp, Shield, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  neighborhood: {
    id: string;
    name: string;
    city: string;
    region: string;
    price_per_m2: number | null;
    yield: number | null;
    safety_score: number | null;
    lifestyle_score: number | null;
    vibe: string | null;
    investment_score: number | null;
  };
  matchScore?: number;
  isSaved: boolean;
  onToggleSave: () => void;
  onViewDetails: () => void;
}

export default function NeighborhoodCard({ neighborhood, matchScore, isSaved, onToggleSave, onViewDetails }: Props) {
  const n = neighborhood;

  return (
    <div className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      {matchScore !== undefined && (
        <div className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
          {matchScore}% match
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-serif text-xl font-semibold text-foreground">{n.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {n.city}, {n.region}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Heart className={`h-5 w-5 ${isSaved ? "fill-primary text-primary" : ""}`} />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {n.price_per_m2 && (
          <div className="rounded-lg bg-secondary/50 p-3">
            <span className="text-xs text-muted-foreground">Price/m²</span>
            <p className="font-mono text-sm font-semibold text-foreground">€{n.price_per_m2.toLocaleString()}</p>
          </div>
        )}
        {n.yield && (
          <div className="rounded-lg bg-secondary/50 p-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Yield</span>
            <p className="font-mono text-sm font-semibold text-primary">{n.yield.toFixed(1)}%</p>
          </div>
        )}
        {n.safety_score && (
          <div className="rounded-lg bg-secondary/50 p-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Safety</span>
            <p className="font-mono text-sm font-semibold text-foreground">{n.safety_score}/10</p>
          </div>
        )}
        {n.lifestyle_score && (
          <div className="rounded-lg bg-secondary/50 p-3">
            <span className="text-xs text-muted-foreground">Lifestyle</span>
            <p className="font-mono text-sm font-semibold text-foreground">{n.lifestyle_score}/10</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {n.vibe && (
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
            {n.vibe}
          </span>
        )}
        {n.investment_score && n.investment_score >= 7 && (
          <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-xs text-green-400">
            Strong Investment
          </span>
        )}
      </div>

      <Button onClick={onViewDetails} variant="ghost" size="sm" className="mt-5 w-full justify-between text-primary hover:text-primary">
        View Details <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
