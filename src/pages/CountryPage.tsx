import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MapPin, ArrowRight, Building2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Country {
  id: string;
  name: string;
  slug: string;
  currency_code: string;
}

interface City {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function CountryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [country, setCountry] = useState<Country | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: c } = await supabase.from("countries").select("*").eq("slug", slug).single();
      if (c) {
        setCountry(c);
        const { data: ct } = await supabase.from("cities").select("*").eq("country_id", c.id);
        setCities(ct || []);
      }
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (country) {
      document.title = `Invest in ${country.name} Real Estate | Keys to the City`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", `Discover real estate investment opportunities in ${country.name}. City guides, neighborhood intelligence, and curated experiences by KTTC.`);
    }
  }, [country]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <h1 className="font-serif text-3xl text-foreground">Country not found</h1>
            <Link to="/explore" className="mt-4 inline-block text-primary hover:underline">Browse all destinations</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: country.name,
    description: `Real estate investment opportunities in ${country.name}`,
    url: `${window.location.origin}/explore/${country.slug}`,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-center gap-2 text-primary text-sm mb-4">
            <Link to="/explore" className="hover:underline">Explore</Link>
            <span>/</span>
            <span>{country.name}</span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Invest in <span className="text-primary">{country.name}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Discover the best cities for real estate investment in {country.name}. 
            Access neighborhood intelligence, city papers, and curated experiences 
            designed for international investors.
          </p>
          <div className="mt-8 flex gap-4">
            <Button asChild className="bg-primary text-primary-foreground">
              <Link to="/signup">Join KTTC</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="#cities">Explore Cities</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/50 py-16">
        <div className="mx-auto max-w-6xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: "Cities Covered", value: cities.length.toString(), icon: Building2 },
            { label: "Currency", value: country.currency_code, icon: TrendingUp },
            { label: "City Papers", value: "Detailed", icon: MapPin },
            { label: "Experiences", value: "Curated", icon: ArrowRight },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <s.icon className="mx-auto h-6 w-6 text-primary mb-3" />
              <p className="font-mono text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-serif text-3xl font-semibold text-foreground mb-2">
            Cities in {country.name}
          </h2>
          <p className="text-muted-foreground mb-12">
            Each city has been analyzed for investment potential, lifestyle quality, and rental yield.
          </p>

          {cities.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <MapPin className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">City guides coming soon for {country.name}.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cities.map((city) => (
                <Link
                  key={city.id}
                  to={`/explore/${country.slug}/${city.slug}`}
                  className="group rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {city.name}
                      </h3>
                      {city.description && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{city.description}</p>
                      )}
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card/30 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-3xl font-semibold text-foreground">
            Ready to invest in {country.name}?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join KTTC to access detailed city papers, neighborhood intelligence, 
            deal calculators, and curated investment experiences.
          </p>
          <Button asChild size="lg" className="mt-8 bg-primary text-primary-foreground">
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
