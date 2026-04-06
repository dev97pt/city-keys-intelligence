import type {
  PaperSection,
  TextSection,
  MetricsSection,
  ProTipSection,
  ProsConsSection,
  BulletListSection,
  BuyerProfilesSection,
  ChecklistSection,
  CTASection,
} from "@/types/cityPaperSections";
import { Lightbulb, CheckCircle2, XCircle, User, AlertTriangle, Mail, MessageCircle } from "lucide-react";

/* ── Text ── */
function RenderText({ data }: { data: TextSection["data"] }) {
  return (
    <section className="space-y-4">
      {data.title && (
        <h2 className="font-serif text-2xl font-semibold text-foreground tracking-tight">{data.title}</h2>
      )}
      <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{data.content}</div>
    </section>
  );
}

/* ── Metrics ── */
function RenderMetrics({ data }: { data: MetricsSection["data"] }) {
  return (
    <section className="space-y-5">
      {data.title && (
        <h2 className="font-serif text-2xl font-semibold text-foreground tracking-tight">{data.title}</h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.metrics.map((m, i) => (
          <div key={i} className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
            <p className="text-2xl font-bold text-primary font-serif">{m.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Pro Tip ── */
function RenderProTip({ data }: { data: ProTipSection["data"] }) {
  return (
    <section className="rounded-xl border border-primary/30 bg-primary/5 p-6">
      <div className="flex gap-3">
        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Pro Tip</p>
          <p className="text-sm leading-relaxed text-foreground/90">{data.content}</p>
        </div>
      </div>
    </section>
  );
}

/* ── Pros & Cons ── */
function RenderProsCons({ data }: { data: ProsConsSection["data"] }) {
  return (
    <section className="space-y-5">
      <h2 className="font-serif text-2xl font-semibold text-foreground tracking-tight">Investment Analysis</h2>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Green Flags
          </p>
          <ul className="space-y-2">
            {data.greenFlags.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/80">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 space-y-3">
          <p className="flex items-center gap-2 text-sm font-bold text-red-400">
            <XCircle className="h-4 w-4" /> Red Flags
          </p>
          <ul className="space-y-2">
            {data.redFlags.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm text-foreground/80">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── Bullet List ── */
function RenderBulletList({ data }: { data: BulletListSection["data"] }) {
  return (
    <section className="space-y-4">
      {data.title && (
        <h2 className="font-serif text-2xl font-semibold text-foreground tracking-tight">{data.title}</h2>
      )}
      <ul className="space-y-3">
        {data.items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm text-foreground/80">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ── Buyer Profiles ── */
function RenderBuyerProfiles({ data }: { data: BuyerProfilesSection["data"] }) {
  return (
    <section className="space-y-5">
      <h2 className="font-serif text-2xl font-semibold text-foreground tracking-tight">
        Who Should (and Shouldn't) Buy Here
      </h2>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="flex items-center gap-2 text-sm font-bold text-primary">
            <User className="h-4 w-4" /> Ideal Buyer Profiles
          </p>
          {data.idealBuyers.map((b, i) => (
            <div key={i}>
              <p className="text-sm font-semibold text-foreground">{b.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{b.description}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="flex items-center gap-2 text-sm font-bold text-yellow-400">
            <AlertTriangle className="h-4 w-4" /> Proceed with Caution
          </p>
          {data.cautionBuyers.map((b, i) => (
            <div key={i}>
              <p className="text-sm font-semibold text-foreground">{b.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Checklist ── */
const PRIORITY_STYLES: Record<string, { label: string; className: string }> = {
  critical: { label: "CRITICAL", className: "text-red-400 font-bold" },
  important: { label: "IMPORTANT", className: "text-primary font-bold" },
  optional: { label: "OPTIONAL", className: "text-muted-foreground font-bold" },
};

function RenderChecklist({ data }: { data: ChecklistSection["data"] }) {
  return (
    <section className="space-y-4">
      {/* Phase header - gold bar like the document */}
      {data.phaseTitle && (
        <div className="bg-primary py-2.5 px-5 rounded-sm">
          <h3 className="font-serif text-xl font-bold text-primary-foreground">{data.phaseTitle}</h3>
        </div>
      )}

      <div className="space-y-0 divide-y divide-border/50">
        {data.items.map((item, i) => {
          const priority = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.important;
          return (
            <div key={i} className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[24px_1fr_120px_120px] gap-3 items-start py-3 px-2">
              {/* Checkbox visual */}
              <div className="mt-0.5 h-4 w-4 rounded border border-muted-foreground/40 shrink-0" />

              {/* Task description */}
              <p className="text-sm text-foreground/90 leading-relaxed">{item.task}</p>

              {/* Priority badge */}
              <span className={`text-[10px] uppercase tracking-wider whitespace-nowrap ${priority.className}`}>
                {priority.label}
              </span>

              {/* Timeline */}
              <span className="text-xs text-muted-foreground whitespace-nowrap">{item.timeline}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── CTA ── */
function RenderCTA({ data }: { data: CTASection["data"] }) {
  return (
    <section className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center space-y-4">
      <h2 className="font-serif text-2xl font-semibold text-foreground">{data.title}</h2>
      <p className="text-sm text-muted-foreground max-w-lg mx-auto">{data.description}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        {data.email && (
          <a
            href={`mailto:${data.email}`}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Mail className="h-4 w-4" /> Email
          </a>
        )}
        {data.whatsapp && (
          <a
            href={`https://wa.me/${data.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        )}
      </div>
    </section>
  );
}

/* ── Main Renderer ── */
export function SectionRenderer({ section }: { section: PaperSection }) {
  switch (section.type) {
    case "text":
      return <RenderText data={section.data} />;
    case "metrics":
      return <RenderMetrics data={section.data} />;
    case "pro_tip":
      return <RenderProTip data={section.data} />;
    case "pros_cons":
      return <RenderProsCons data={section.data} />;
    case "bullet_list":
      return <RenderBulletList data={section.data} />;
    case "buyer_profiles":
      return <RenderBuyerProfiles data={section.data} />;
    case "checklist":
      return <RenderChecklist data={section.data} />;
    case "cta":
      return <RenderCTA data={section.data} />;
    default:
      return null;
  }
}
