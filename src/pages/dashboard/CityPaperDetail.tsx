import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, MapPin } from "lucide-react";
import PdfViewer from "@/components/PdfViewer";

interface PaperDetail {
  id: string;
  title: string;
  description: string | null;
  content_markdown: string | null;
  pdf_url: string | null;
  pdf_path: string | null;
  thumbnail_url: string | null;
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

  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl">
        <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground" onClick={() => navigate("/dashboard/city-papers")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Papers
        </Button>

        <h1 className="font-serif text-3xl font-semibold text-foreground">{paper.title}</h1>

        <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {countryName}{cityName ? ` · ${cityName}` : ""}</span>
          <span>·</span>
          <span>{new Date(paper.created_at).toLocaleDateString()}</span>
        </div>

        {paper.description && (
          <p className="mt-4 text-muted-foreground leading-relaxed">{paper.description}</p>
        )}
      </div>

      {(paper.pdf_url || paper.pdf_path) && (
        <div className="mt-8 -mx-4 sm:-mx-6 lg:-mx-10">
          <PdfViewer url={paper.pdf_url} path={paper.pdf_path} title={paper.title} />
        </div>
      )}

      {!paper.pdf_url && !paper.pdf_path && paper.content_markdown && (
        <div className="mt-8 prose prose-invert prose-sm max-w-none
          prose-headings:font-serif prose-headings:text-foreground
          prose-p:text-muted-foreground prose-strong:text-foreground
          prose-a:text-primary">
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
    </div>
  );
}
