import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MapPin, ArrowLeft, TrendingUp, Shield, Train, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NeighborhoodStat {
  id: string;
  name: string;
  price_per_m2: number | null;
  rental_yield: number | null;
  safety_score: number | null;
  transport_score: number | null;
  lifestyle_score: number | null;
  investment_rating: string | null;
}

export default function CityPage() {
  const { countrySlug, citySlug } = useParams<{ countrySlug: string; citySlug: string }>();
  const [country, setCountry] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [city, setCity] = useState<{ id: string; name: string; slug: string; description: string | null } | null>(null);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!countrySlug || !citySlug) return;
    (async () => {
      const { data: co } = await supabase.from("countries").select("id,name,slug").eq("slug", countrySlug).single();
      if (!co) { setLoading(false); return; }
      setCountry(co);
      const { data: ci } = await supabase.from("cities").select("id,name,slug,description").eq("slug", citySlug).eq("country_id", co.id).single();
      if (!ci) { setLoading(false); return; }
      setCity(ci);
      const { data: ns } = await supabase.from("neighborhood_stats").select("*").eq("city_id", ci.id).order("name");
      setNeighborhoods(ns || []);
      setLoading(false);
    })();
  }, [countrySlug, citySlug]);

  useEffect(() => {
    if (city && country) {
      document.title = `${city.name}, ${country.name} – Real Estate Investment Guide | KTTC`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", `Investment guide for ${city.name}, ${country.name}. Neighborhood data, rental yields, safety scores, and lifestyle ratings.`);
    }
  }, [city, country]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!city || !country) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <h1 className="font-serif text-3xl text-foreground">City not found</h1>
        </div>
        <Footer />
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "City",
    name: city.name,
    containedInPlace: { "@type": "Country", name: country.name },
    description: city.description || `Real estate investment guide for ${city.name}`,
    url: `${window.location.origin}/explore/${country.slug}/${city.slug}`,
  };

  const ratingColor = (rating: string | null) => {
    if (!rating) return "text-muted-foreground";
    const r = rating.toLowerCase();
    if (r === "a" || r === "a+") return "text-green-400";
    if (r === "b" || r === "b+") return "text-primary";
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/explore" className="hover:text-primary">Explore</Link>
            <span>/</span>
            <Link to={`/explore/${country.slug}`} className="hover:text-primary">{country.name}</Link>
            <span>/</span>
            <span className="text-foreground">{city.name}</span>
          </div>

          <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground">
            {city.name}
          </h1>
          {city.description && (
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{city.description}</p>
          )}

          <div className="mt-8 flex gap-4">
            <Button asChild className="bg-primary text-primary-foreground">
              <Link to="/signup">Access Full Intel</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/explore/${country.slug}`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to {country.name}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Neighborhood Intel Preview */}
      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-serif text-3xl font-semibold text-foreground mb-2">
            Neighborhood Intelligence
          </h2>
          <p className="text-muted-foreground mb-10">
            Data-driven neighborhood analysis to help you make informed investment decisions.
          </p>

          {neighborhoods.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <MapPin className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Neighborhood data coming soon for {city.name}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">Neighborhood</th>
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">Price/m²</th>
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">Yield</th>
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">Safety</th>
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">Transport</th>
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">Lifestyle</th>
                    <th className="px-5 py-4 text-left font-medium text-muted-foreground">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {neighborhoods.map((n) => (
                    <tr key={n.id} className="border-b border-border/50 hover:bg-card/50">
                      <td className="px-5 py-4 font-medium text-foreground">{n.name}</td>
                      <td className="px-5 py-4 font-mono text-foreground">
                        {n.price_per_m2 ? `€${n.price_per_m2.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-4 font-mono text-primary">
                        {n.rental_yield ? `${n.rental_yield}%` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <ScoreBar value={n.safety_score} icon={Shield} />
                      </td>
                      <td className="px-5 py-4">
                        <ScoreBar value={n.transport_score} icon={Train} />
                      </td>
                      <td className="px-5 py-4">
                        <ScoreBar value={n.lifestyle_score} icon={Star} />
                      </td>
                      <td className={`px-5 py-4 font-mono font-bold ${ratingColor(n.investment_rating)}`}>
                        {n.investment_rating || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="text-foreground font-medium">
              Want full access to neighborhood data, city papers, and deal calculators?
            </p>
            <Button asChild size="sm" className="mt-4 bg-primary text-primary-foreground">
              <Link to="/signup">Join KTTC</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ScoreBar({ value, icon: Icon }: { value: number | null; icon: React.ElementType }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <div className="h-1.5 w-16 rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(value * 10, 100)}%` }} />
      </div>
      <span className="font-mono text-xs text-muted-foreground">{value}</span>
    </div>
  );
}
