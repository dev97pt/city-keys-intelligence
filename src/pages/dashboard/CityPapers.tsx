import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";

interface CityPaper {
  id: string;
  title: string;
  content_markdown: string | null;
  pdf_url: string | null;
  created_at: string;
  cities: { name: string } | null;
  countries: { name: string } | null;
}

export default function CityPapers() {
  const [papers, setPapers] = useState<CityPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("city_papers")
      .select("id, title, content_markdown, pdf_url, created_at, cities(name), countries(name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPapers((data as unknown as CityPaper[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-3xl font-semibold text-foreground">City Papers</h1>
      <p className="mt-2 text-sm text-muted-foreground">Step-by-step guides for your target cities.</p>

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
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {papers.map((p) => (
            <div key={p.id} className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-start gap-3">
                <FileText className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="font-serif text-lg font-semibold text-foreground">{p.title}</h3>
                  <div className="mt-1 flex gap-2">
                    {p.countries && (
                      <span className="text-xs text-muted-foreground">{p.countries.name}</span>
                    )}
                    {p.cities && (
                      <span className="text-xs text-primary">• {p.cities.name}</span>
                    )}
                  </div>
                  {p.content_markdown && (
                    <p className="mt-3 text-xs text-muted-foreground line-clamp-3">{p.content_markdown}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
