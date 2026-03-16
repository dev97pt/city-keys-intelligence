import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Compass, Calendar, MapPin, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";

interface Experience {
  id: string;
  title: string;
  type: string;
  date_start: string | null;
  date_end: string | null;
  price: number;
  capacity: number;
  description: string | null;
  cities: { name: string } | null;
  countries: { name: string } | null;
}

const PRICE_MAP: Record<string, string> = {
  explorer: "price_1TBQJAKGs9eQsIlKOn0hxret",
  builder: "price_1TBQJIKGs9eQsIlKgYy1zZ2Z",
};

export default function Experiences() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({ title: "Booking confirmed!", description: "Check your email for details." });
    }
  }, [searchParams]);

  useEffect(() => {
    supabase
      .from("experiences")
      .select("id, title, type, date_start, date_end, price, capacity, description, cities(name), countries(name)")
      .order("date_start")
      .then(({ data }) => {
        setExperiences((data as unknown as Experience[]) || []);
        setLoading(false);
      });
  }, []);

  const handleBook = async (exp: Experience) => {
    const priceId = PRICE_MAP[exp.type];
    if (!priceId) {
      toast({ variant: "destructive", title: "Error", description: "No price configured for this experience." });
      return;
    }

    setBookingId(exp.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { experienceId: exp.id, priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Booking error", description: err.message });
    } finally {
      setBookingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-3xl font-semibold text-foreground">Experiences</h1>
      <p className="mt-2 text-sm text-muted-foreground">Book your transformation trip.</p>

      {experiences.length === 0 ? (
        <div className="mt-12 rounded-lg border border-border bg-card p-12 text-center">
          <Compass className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">No upcoming experiences. Check back soon.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {experiences.map((exp) => (
            <div key={exp.id} className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  exp.type === "builder" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                }`}>
                  {exp.type === "builder" ? "Builder Retreat" : "Explorer"}
                </span>
              </div>
              <h3 className="mt-3 font-serif text-xl font-semibold text-foreground">{exp.title}</h3>
              {exp.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{exp.description}</p>
              )}
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                {exp.date_start && exp.date_end && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(exp.date_start).toLocaleDateString()} – {new Date(exp.date_end).toLocaleDateString()}
                  </div>
                )}
                {exp.cities && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    {exp.cities.name}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  {exp.capacity} spots
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-mono text-lg font-semibold text-primary">€{exp.price.toLocaleString()}</span>
                <Button
                  onClick={() => handleBook(exp)}
                  disabled={bookingId === exp.id}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {bookingId === exp.id ? "Processing…" : "Reserve Spot"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
