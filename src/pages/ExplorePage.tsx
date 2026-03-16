import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Globe, ArrowRight } from "lucide-react";

interface Country {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export default function ExplorePage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Explore Investment Destinations | Keys to the City";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Browse real estate investment destinations across Europe. City guides, neighborhood intelligence, and curated experiences by KTTC.");

    supabase.from("countries").select("*").eq("is_active", true).order("name").then(({ data }) => {
      setCountries(data || []);
      setLoading(false);
    });
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "KTTC Investment Destinations",
    description: "Real estate investment destinations curated by Keys to the City",
    itemListElement: countries.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: { "@type": "Place", name: c.name, url: `${window.location.origin}/explore/${c.slug}` },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground">
            Explore <span className="text-primary">Destinations</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Discover the best countries and cities for real estate investment. 
            Each destination comes with detailed city papers, neighborhood data, and local partner networks.
          </p>
        </div>
      </section>

      <section className="border-t border-border py-20">
        <div className="mx-auto max-w-6xl px-6">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : countries.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-16 text-center">
              <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="font-serif text-2xl text-foreground">Destinations coming soon</h2>
              <p className="mt-2 text-muted-foreground">We're currently preparing our first country guides.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {countries.map((country) => (
                <Link
                  key={country.id}
                  to={`/explore/${country.slug}`}
                  className="group rounded-xl border border-border bg-card p-8 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5"
                >
                  <Globe className="h-8 w-8 text-primary mb-4" />
                  <h2 className="font-serif text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {country.name}
                  </h2>
                  <div className="mt-4 flex items-center text-sm text-primary">
                    <span>Explore cities</span>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
