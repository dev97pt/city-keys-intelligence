import { MapPin, Calendar, FileText } from "lucide-react";
import kncLogo from "@/assets/knc-logo-gold.png";

interface PaperHeaderProps {
  title: string;
  subtitle?: string;
  countryName: string;
  cityName?: string;
  createdAt: string;
  sectionCount: number;
  paperType?: string;
}

export function PaperHeader({ title, subtitle, countryName, cityName, createdAt, sectionCount, paperType }: PaperHeaderProps) {
  return (
    <header className="space-y-6">
      {/* Logo */}
      <div className="flex justify-center py-4">
        <img src={kncLogo} alt="Kings 'n Company" className="h-16 md:h-20 object-contain" />
      </div>

      {/* Confidential bar */}
      <div className="bg-primary py-2 px-4 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground">
          Confidential – Members Only
        </p>
      </div>

      {/* Breadcrumb */}
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary text-center">
        Keys to the City &bull; City Papers {paperType ? `\u2022 ${paperType}` : "\u2022 Deep Dive"}
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
          Created: {new Date(createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
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

      <div className="border-b border-border" />
    </header>
  );
}
