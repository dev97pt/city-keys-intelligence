import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { FileText, MapPin, Calculator, Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Profile {
  full_name: string | null;
  relocation_stage: string | null;
  main_goal: string | null;
  onboarding_completed: boolean;
  target_city_id: string | null;
}

type Rec = { id: string; title: string; to: string; kind: string };

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [steps, setSteps] = useState({ papers: false, shortlist: false, trip: false });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, relocation_stage, main_goal, onboarding_completed, target_city_id")
        .eq("id", user.id)
        .single();
      setProfile(p);

      const cityId = p?.target_city_id;
      if (cityId) {
        const { data: city } = await supabase.from("cities").select("name").eq("id", cityId).maybeSingle();
        setCityName(city?.name ?? null);
      }

      let papersQ = supabase.from("city_papers").select("id, title").eq("is_published", true).limit(2);
      if (cityId) papersQ = papersQ.eq("city_id", cityId);
      const [{ data: papers }, { data: hoods }, { count: shortCount }, { count: bookCount }] = await Promise.all([
        papersQ,
        supabase.from("neighborhoods").select("id, name").limit(2),
        supabase.from("user_shortlists").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setRecs([
        ...(papers ?? []).map((x: any) => ({ id: x.id, title: x.title, to: `/dashboard/city-papers/${x.id}`, kind: "City Paper" })),
        ...(hoods ?? []).map((x: any) => ({ id: x.id, title: x.name, to: `/dashboard/neighborhood-intel/${x.id}`, kind: "Neighborhood" })),
      ]);
      setSteps({ papers: (papers?.length ?? 0) > 0, shortlist: (shortCount ?? 0) > 0, trip: (bookCount ?? 0) > 0 });
    })();
  }, [user]);

  const progress = [
    { label: "Profile set up", done: !!profile?.onboarding_completed, to: "/dashboard/settings" },
    { label: "Research your city", done: steps.papers, to: "/dashboard/city-papers" },
    { label: "Shortlist neighborhoods", done: steps.shortlist, to: "/dashboard/neighborhood-intel" },
    { label: "Book a scouting trip", done: steps.trip, to: "/dashboard/experiences" },
  ];
  const nextStep = progress.find((s) => !s.done);

  const quickLinks = [
    { title: "City Papers", desc: "Guides for your target city", icon: FileText, url: "/dashboard/city-papers" },
    { title: "Neighborhood Intel", desc: "Investment data & scores", icon: MapPin, url: "/dashboard/neighborhood-intel" },
    { title: "Deal Calculators", desc: "Analyze property deals", icon: Calculator, url: "/dashboard/calculators" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-lg border border-border bg-card p-8">
        <h1 className="font-serif text-3xl font-semibold text-foreground">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {cityName && <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs text-primary">{cityName}</span>}
          {profile?.relocation_stage && <span className="rounded-full border border-border bg-secondary px-3 py-0.5 text-xs text-muted-foreground">{profile.relocation_stage}</span>}
          {profile?.main_goal && <span className="rounded-full border border-border bg-secondary px-3 py-0.5 text-xs text-muted-foreground">{profile.main_goal}</span>}
        </div>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Your relocation journey</p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-4">
            {progress.map((s, i) => (
              <li key={s.label}>
                <Link to={s.to} className="flex items-center gap-2 text-sm">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${s.done ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
                    {s.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={s.done ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
                </Link>
              </li>
            ))}
          </ol>
          {nextStep && (
            <Link to={nextStep.to} className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              Next step: {nextStep.label} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {recs.length > 0 && (
        <div>
          <h2 className="font-serif text-xl font-semibold text-foreground">Recommended for you{cityName ? ` in ${cityName}` : ""}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {recs.map((r) => (
              <Link key={r.kind + r.id} to={r.to} className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-widest text-primary">{r.kind}</p>
                  <p className="mt-1 truncate text-sm text-foreground">{r.title}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((l) => (
          <Link key={l.title} to={l.url} className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/30">
            <l.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-serif text-lg font-semibold text-foreground">{l.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
