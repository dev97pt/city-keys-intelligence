import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bot, FileText, MapPin, Clock } from "lucide-react";

const COPY: Record<string, { title: string; desc: string }> = {
  partners: {
    title: "Partner Directory",
    desc: "Our vetted directory of lawyers, tax advisors and agents is launching soon. Meanwhile, our assistant and City Papers can answer most questions.",
  },
  templates: {
    title: "Templates & Checklists",
    desc: "Ready-to-use relocation checklists and contract templates are on the way. Until then, start with the guides below.",
  },
};

export default function ComingSoon() {
  const key = useLocation().pathname.split("/").pop() ?? "";
  const c = COPY[key] ?? { title: "Coming Soon", desc: "This feature is under development. Here's where you can go in the meantime." };
  const next = [
    { to: "/dashboard/ai-assistant", icon: Bot, label: "Ask the AI Assistant" },
    { to: "/dashboard/city-papers", icon: FileText, label: "Read a City Paper" },
    { to: "/dashboard/neighborhood-intel", icon: MapPin, label: "Find your neighborhood" },
  ];
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
        <Clock className="h-3 w-3" /> Launching soon
      </span>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-foreground">{c.title}</h1>
      <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">{c.desc}</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {next.map((n) => (
          <Link key={n.to} to={n.to} className="rounded-lg border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30">
            <n.icon className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-2 text-sm text-foreground">{n.label}</p>
          </Link>
        ))}
      </div>
      <Button asChild variant="ghost" className="mt-6 text-muted-foreground">
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
