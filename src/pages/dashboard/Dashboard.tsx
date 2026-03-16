import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { FileText, MapPin, Calculator } from "lucide-react";
import { Link } from "react-router-dom";

interface Profile {
  full_name: string | null;
  relocation_stage: string | null;
  main_goal: string | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, relocation_stage, main_goal")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const quickLinks = [
    { title: "City Papers", desc: "Guides for your target city", icon: FileText, url: "/dashboard/city-papers" },
    { title: "Neighborhood Intel", desc: "Investment data & scores", icon: MapPin, url: "/dashboard/neighborhood-intel" },
    { title: "Deal Calculators", desc: "Analyze property deals", icon: Calculator, url: "/dashboard/calculators" },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-lg border border-border bg-card p-8">
        <h1 className="font-serif text-3xl font-semibold text-foreground">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {profile?.relocation_stage && (
            <span className="mr-3 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs text-primary">
              {profile.relocation_stage}
            </span>
          )}
          {profile?.main_goal && (
            <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-0.5 text-xs text-muted-foreground">
              {profile.main_goal}
            </span>
          )}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {quickLinks.map((l) => (
          <Link
            key={l.title}
            to={l.url}
            className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/30"
          >
            <l.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-serif text-lg font-semibold text-foreground">{l.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{l.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
