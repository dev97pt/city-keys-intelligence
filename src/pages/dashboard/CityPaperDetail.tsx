import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { PaperHeader } from "@/components/city-papers/PaperHeader";
import { PaperFooter } from "@/components/city-papers/PaperFooter";
import { SectionRenderer } from "@/components/city-papers/SectionRenderer";
import PdfViewer from "@/components/PdfViewer";
import type { PaperSection } from "@/types/cityPaperSections";

interface PaperDetail {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  content_markdown: string | null;
  pdf_url: string | null;
  pdf_path: string | null;
  thumbnail_url: string | null;
  sections: PaperSection[] | null;
  created_at: string;
  country_id: string;
  city_id: string | null;
}

export default function CityPaperDetail() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState<PaperDetail | null>(null);
  const [countryName, setCountryName] = useState("");
  const [cityName, setCityName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paperId) return;
    supabase
      .from("city_papers")
      .select("*")
      .eq("id", paperId)
      .eq("is_published", true)
      .single()
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return; }
        setPaper(data as unknown as PaperDetail);
        const { data: co } = await supabase.from("countries").select("name").eq("id", data.country_id).single();
        if (co) setCountryName(co.name);
        if (data.city_id) {
          const { data: ci } = await supabase.from("cities").select("name").eq("id", data.city_id).single();
          if (ci) setCityName(ci.name);
        }
        setLoading(false);
      });
  }, [paperId]);

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  if (!paper) return (
    <div className="mx-auto max-w-3xl text-center py-24">
      <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
      <p className="mt-4 text-muted-foreground">Paper not found.</p>
      <Button variant="ghost" className="mt-4" onClick={() => navigate("/dashboard/city-papers")}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Papers
      </Button>
    </div>
  );

  const sections: PaperSection[] = Array.isArray(paper.sections) && paper.sections.length > 0
    ? paper.sections
    : [];

  const hasPdf = !!(paper.pdf_path || paper.pdf_url);
  const hasStructuredContent = !hasPdf && sections.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground" onClick={() => navigate("/dashboard/city-papers")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Papers
      </Button>

      {hasPdf ? (
        <div className="space-y-6">
          <header>
            <h1 className="font-serif text-3xl font-semibold text-foreground tracking-tight">{paper.title}</h1>
            {paper.subtitle && (
              <p className="mt-2 text-base text-muted-foreground">{paper.subtitle}</p>
            )}
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{countryName}{cityName ? ` · ${cityName}` : ""}</span>
              <span>·</span>
              <span>{new Date(paper.created_at).toLocaleDateString()}</span>
            </div>
            {paper.description && (
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">{paper.description}</p>
            )}
          </header>
          <PdfViewer path={paper.pdf_path} url={paper.pdf_url} title={paper.title} />
        </div>
      ) : hasStructuredContent ? (
        <div className="space-y-10">
          <PaperHeader
            title={paper.title}
            subtitle={paper.subtitle || undefined}
            countryName={countryName}
            cityName={cityName || undefined}
            createdAt={paper.created_at}
            sectionCount={sections.length}
          />

          {paper.description && (
            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-semibold text-foreground tracking-tight">Executive Summary</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{paper.description}</p>
            </section>
          )}

          {sections.map(section => (
            <SectionRenderer key={section.id} section={section} />
          ))}

          <PaperFooter createdAt={paper.created_at} />
        </div>
      ) : (
        <>
          <h1 className="font-serif text-3xl font-semibold text-foreground">{paper.title}</h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{countryName}{cityName ? ` · ${cityName}` : ""}</span>
            <span>·</span>
            <span>{new Date(paper.created_at).toLocaleDateString()}</span>
          </div>
          {paper.description && <p className="mt-4 text-muted-foreground leading-relaxed">{paper.description}</p>}
          {paper.content_markdown && (
            <div className="mt-8 prose prose-invert prose-sm max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
              {paper.content_markdown.split("\n").map((line, i) => {
                if (line.startsWith("### ")) return <h3 key={i}>{line.slice(4)}</h3>;
                if (line.startsWith("## ")) return <h2 key={i}>{line.slice(3)}</h2>;
                if (line.startsWith("# ")) return <h1 key={i}>{line.slice(2)}</h1>;
                if (line.startsWith("- ")) return <li key={i}>{line.slice(2)}</li>;
                if (line.trim() === "") return <br key={i} />;
                return <p key={i}>{line}</p>;
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
