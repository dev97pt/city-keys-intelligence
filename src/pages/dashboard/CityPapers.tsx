import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FileText, MapPin } from "lucide-react";

interface CityPaper {
  id: string;
  title: string;
  description: string | null;
  content_markdown: string | null;
  thumbnail_url: string | null;
  pdf_url: string | null;
  created_at: string;
  country_id: string;
  city_id: string | null;
}

interface LocationMap { [id: string]: string; }

export default function CityPapers() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<CityPaper[]>([]);
  const [countries, setCountries] = useState<LocationMap>({});
  const [cities, setCities] = useState<LocationMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: co }, { data: ci }] = await Promise.all([
        supabase.from("city_papers").select("*").eq("is_published", true).order("created_at", { ascending: false }),
        supabase.from("countries").select("id, name"),
        supabase.from("cities").select("id, name"),
      ]);
      setPapers((p as unknown as CityPaper[]) || []);
      const cm: LocationMap = {}; (co || []).forEach(c => cm[c.id] = c.name);
      const cim: LocationMap = {}; (ci || []).forEach(c => cim[c.id] = c.name);
      setCountries(cm);
      setCities(cim);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-3xl font-semibold text-foreground">City Papers</h1>
      <p className="mt-2 text-sm text-muted-foreground">In-depth guides for your target cities and countries.</p>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : papers.length === 0 ? (
        <div className="mt-12 rounded-lg border border-border bg-card p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">No city papers available yet. Check back soon.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {papers.map(p => (
            <button
              key={p.id}
              onClick={() => navigate(`/dashboard/city-papers/${p.id}`)}
              className="group rounded-lg border border-border bg-card overflow-hidden text-left transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              {p.thumbnail_url ? (
                <div className="aspect-video bg-secondary overflow-hidden">
                  <img src={p.thumbnail_url} alt={p.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                </div>
              ) : (
                <div className="aspect-video bg-secondary/50 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-muted-foreground/30" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-serif text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{p.title}</h3>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{countries[p.country_id] || "—"}{p.city_id && cities[p.city_id] ? ` · ${cities[p.city_id]}` : ""}</span>
                </div>
                {p.description && (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
