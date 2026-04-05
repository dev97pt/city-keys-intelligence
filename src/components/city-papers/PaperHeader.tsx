import { MapPin, Calendar, FileText } from "lucide-react";

interface PaperHeaderProps {
  title: string;
  subtitle?: string;
  countryName: string;
  cityName?: string;
  createdAt: string;
  sectionCount: number;
}

export function PaperHeader({ title, subtitle, countryName, cityName, createdAt, sectionCount }: PaperHeaderProps) {
  return (
    <header className="space-y-6 pb-8 border-b border-border">
      {/* Breadcrumb label */}
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
        Keys to the City &bull; City Papers &bull; Deep Dive
      </p>

      <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground leading-tight">
        {title}
      </h1>

      {subtitle && (
        <p className="font-serif text-lg italic text-muted-foreground">{subtitle}</p>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {countryName}{cityName ? ` · ${cityName}` : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          {sectionCount} sections
        </span>
      </div>
    </header>
  );
}
