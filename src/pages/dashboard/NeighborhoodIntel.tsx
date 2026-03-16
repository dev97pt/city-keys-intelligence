import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface NeighborhoodStat {
  id: string;
  name: string;
  price_per_m2: number | null;
  rental_yield: number | null;
  safety_score: number | null;
  transport_score: number | null;
  lifestyle_score: number | null;
  investment_rating: string | null;
  cities: { name: string } | null;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground">—</span>;
  const color =
    score >= 8 ? "text-green-400" : score >= 5 ? "text-primary" : "text-red-400";
  return <span className={`font-mono text-sm ${color}`}>{score.toFixed(1)}</span>;
}

export default function NeighborhoodIntel() {
  const [stats, setStats] = useState<NeighborhoodStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("neighborhood_stats")
      .select("id, name, price_per_m2, rental_yield, safety_score, transport_score, lifestyle_score, investment_rating, cities(name)")
      .order("name")
      .then(({ data }) => {
        setStats((data as unknown as NeighborhoodStat[]) || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-3xl font-semibold text-foreground">Neighborhood Intel</h1>
      <p className="mt-2 text-sm text-muted-foreground">Insider data on where to live and invest.</p>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : stats.length === 0 ? (
        <div className="mt-12 rounded-lg border border-border bg-card p-12 text-center">
          <MapPin className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">No neighborhood data available yet. Check back soon.</p>
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Neighborhood</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-right">Price/m²</TableHead>
                <TableHead className="text-right">Yield</TableHead>
                <TableHead className="text-right">Safety</TableHead>
                <TableHead className="text-right">Transport</TableHead>
                <TableHead className="text-right">Lifestyle</TableHead>
                <TableHead>Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-foreground">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{s.cities?.name ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-foreground">
                    {s.price_per_m2 ? `€${s.price_per_m2.toLocaleString()}` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-primary">
                    {s.rental_yield ? `${s.rental_yield.toFixed(1)}%` : "—"}
                  </TableCell>
                  <TableCell className="text-right"><ScoreBadge score={s.safety_score} /></TableCell>
                  <TableCell className="text-right"><ScoreBadge score={s.transport_score} /></TableCell>
                  <TableCell className="text-right"><ScoreBadge score={s.lifestyle_score} /></TableCell>
                  <TableCell>
                    {s.investment_rating ? (
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {s.investment_rating}
                      </span>
                    ) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
