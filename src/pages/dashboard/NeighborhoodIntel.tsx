import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { MapPin, Heart, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import NeighborhoodQuiz from "@/components/neighborhood/NeighborhoodQuiz";
import NeighborhoodCard from "@/components/neighborhood/NeighborhoodCard";

interface QuizAnswers {
  goal: string;
  budget: string;
  priority: string;
  environment: string;
  region: string;
}

interface Neighborhood {
  id: string; name: string; city: string; region: string; country: string;
  price_per_m2: number | null; yield: number | null; safety_score: number | null;
  transport_score: number | null; lifestyle_score: number | null;
  investment_score: number | null; vibe: string | null; risk_level: string | null;
  distance_to_center: string | null;
}

type View = "quiz" | "results" | "shortlist";

function matchNeighborhoods(neighborhoods: Neighborhood[], answers: QuizAnswers) {
  return neighborhoods
    .filter((n) => {
      // Region filter
      const regionMap: Record<string, string[]> = {
        lisbon: ["Lisbon Region", "Área Metropolitana de Lisboa"],
        porto: ["Porto Region"],
        algarve: ["Algarve"],
      };
      const regions = regionMap[answers.region] || [];
      if (regions.length > 0 && !regions.some((r) => n.region.toLowerCase().includes(r.toLowerCase()))) return false;

      // Budget filter
      if (answers.budget === "low" && n.price_per_m2 && n.price_per_m2 > 2500) return false;
      if (answers.budget === "medium" && n.price_per_m2 && (n.price_per_m2 < 2500 || n.price_per_m2 > 5000)) return false;
      if (answers.budget === "high" && n.price_per_m2 && n.price_per_m2 < 5000) return false;

      return true;
    })
    .map((n) => {
      let score = 50;

      // Goal scoring
      if (answers.goal === "investment") {
        score += (n.investment_score || 0) * 3 + (n.yield || 0) * 2;
      } else if (answers.goal === "lifestyle") {
        score += (n.lifestyle_score || 0) * 3 + (n.safety_score || 0) * 2;
      } else {
        score += (n.investment_score || 0) * 2 + (n.lifestyle_score || 0) * 2;
      }

      // Priority boost
      const priorityMap: Record<string, keyof Neighborhood> = {
        yield: "yield",
        safety: "safety_score",
        lifestyle: "lifestyle_score",
        transport: "transport_score",
      };
      const pKey = priorityMap[answers.priority];
      if (pKey && n[pKey]) score += (n[pKey] as number) * 2;

      // Vibe match
      const vibeMap: Record<string, string[]> = {
        quiet: ["quiet", "residential", "calm", "suburban"],
        trendy: ["trendy", "vibrant", "artsy", "creative"],
        premium: ["premium", "upscale", "established", "luxury"],
        "up-and-coming": ["up-and-coming", "emerging", "developing"],
      };
      const vibes = vibeMap[answers.environment] || [];
      if (n.vibe && vibes.some((v) => n.vibe!.toLowerCase().includes(v))) score += 15;

      return { ...n, matchScore: Math.min(Math.round(score), 99) };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
}

export default function NeighborhoodIntel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState<View>("quiz");
  const [answers, setAnswers] = useState<QuizAnswers | null>(null);
  const [allNeighborhoods, setAllNeighborhoods] = useState<Neighborhood[]>([]);
  const [results, setResults] = useState<(Neighborhood & { matchScore: number })[]>([]);
  const [shortlist, setShortlist] = useState<Set<string>>(new Set());
  const [shortlistNeighborhoods, setShortlistNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(false);

  // Load neighborhoods
  useEffect(() => {
    supabase.from("neighborhoods").select("*").eq("is_published", true).then(({ data }) => {
      setAllNeighborhoods((data as unknown as Neighborhood[]) || []);
    });
  }, []);

  // Load shortlist
  useEffect(() => {
    if (!user) return;
    supabase.from("user_shortlists").select("neighborhood_id").eq("user_id", user.id).then(({ data }) => {
      setShortlist(new Set((data || []).map((d: any) => d.neighborhood_id)));
    });
  }, [user]);

  const onQuizComplete = useCallback((a: QuizAnswers) => {
    setAnswers(a);
    const matched = matchNeighborhoods(allNeighborhoods, a);
    setResults(matched);
    setView("results");
  }, [allNeighborhoods]);

  const toggleSave = async (id: string) => {
    if (!user) return;
    const newSet = new Set(shortlist);
    if (newSet.has(id)) {
      await supabase.from("user_shortlists").delete().eq("user_id", user.id).eq("neighborhood_id", id);
      newSet.delete(id);
      toast.success("Removed from shortlist");
    } else {
      await supabase.from("user_shortlists").insert({ user_id: user.id, neighborhood_id: id });
      newSet.add(id);
      toast.success("Added to shortlist");
    }
    setShortlist(newSet);
  };

  const loadShortlist = async () => {
    if (!user) return;
    setLoading(true);
    const { data: sl } = await supabase.from("user_shortlists").select("neighborhood_id").eq("user_id", user.id);
    const ids = (sl || []).map((d: any) => d.neighborhood_id);
    if (ids.length > 0) {
      const { data } = await supabase.from("neighborhoods").select("*").in("id", ids);
      setShortlistNeighborhoods((data as unknown as Neighborhood[]) || []);
    } else {
      setShortlistNeighborhoods([]);
    }
    setView("shortlist");
    setLoading(false);
  };

  const regionLabel = answers?.region === "lisbon" ? "Lisbon Region" : answers?.region === "porto" ? "Porto Region" : "Algarve";

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Neighborhood Intel</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {view === "quiz" && "Answer a few questions to find your perfect neighborhood."}
            {view === "results" && `Best areas for you in ${regionLabel}`}
            {view === "shortlist" && "Your saved neighborhoods"}
          </p>
        </div>
        <div className="flex gap-2">
          {view !== "quiz" && (
            <Button variant="ghost" size="sm" onClick={() => setView("quiz")} className="text-muted-foreground">
              <Sparkles className="mr-1 h-4 w-4" /> Retake Quiz
            </Button>
          )}
          <Button
            variant={view === "shortlist" ? "default" : "outline"}
            size="sm"
            onClick={loadShortlist}
          >
            <Heart className="mr-1 h-4 w-4" /> Shortlist ({shortlist.size})
          </Button>
        </div>
      </div>

      {/* Quiz View */}
      {view === "quiz" && <NeighborhoodQuiz onComplete={onQuizComplete} />}

      {/* Results View */}
      {view === "results" && (
        <div>
          {results.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-16 text-center">
              <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                No neighborhoods match your criteria yet. Try different options or check back soon.
              </p>
              <Button variant="ghost" size="sm" className="mt-4" onClick={() => setView("quiz")}>
                Retake Quiz
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {results.map((n) => (
                <NeighborhoodCard
                  key={n.id}
                  neighborhood={n}
                  matchScore={n.matchScore}
                  isSaved={shortlist.has(n.id)}
                  onToggleSave={() => toggleSave(n.id)}
                  onViewDetails={() => navigate(`/dashboard/neighborhood-intel/${n.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shortlist View */}
      {view === "shortlist" && (
        <div>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : shortlistNeighborhoods.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-16 text-center">
              <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                No saved neighborhoods yet. Take the quiz to discover your ideal areas.
              </p>
              <Button variant="ghost" size="sm" className="mt-4" onClick={() => setView("quiz")}>
                <Sparkles className="mr-1 h-4 w-4" /> Start Quiz
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {shortlistNeighborhoods.map((n) => (
                <NeighborhoodCard
                  key={n.id}
                  neighborhood={n}
                  isSaved={true}
                  onToggleSave={() => toggleSave(n.id)}
                  onViewDetails={() => navigate(`/dashboard/neighborhood-intel/${n.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
