export type SectionType =
  | "text"
  | "metrics"
  | "pro_tip"
  | "pros_cons"
  | "bullet_list"
  | "buyer_profiles"
  | "checklist"
  | "cta";

export interface BaseSection {
  id: string;
  type: SectionType;
}

export interface TextSection extends BaseSection {
  type: "text";
  data: { title: string; content: string };
}

export interface MetricItem {
  label: string;
  value: string;
}

export interface MetricsSection extends BaseSection {
  type: "metrics";
  data: { title: string; metrics: MetricItem[] };
}

export interface ProTipSection extends BaseSection {
  type: "pro_tip";
  data: { content: string };
}

export interface ProsConsSection extends BaseSection {
  type: "pros_cons";
  data: { greenFlags: string[]; redFlags: string[] };
}

export interface BulletListSection extends BaseSection {
  type: "bullet_list";
  data: { title: string; items: string[] };
}

export interface BuyerProfileItem {
  label: string;
  description: string;
}

export interface BuyerProfilesSection extends BaseSection {
  type: "buyer_profiles";
  data: { idealBuyers: BuyerProfileItem[]; cautionBuyers: BuyerProfileItem[] };
}

export interface ChecklistItem {
  task: string;
  priority: "critical" | "important" | "optional";
  timeline: string;
  notes?: string;
}

export interface ChecklistSection extends BaseSection {
  type: "checklist";
  data: { phaseTitle: string; items: ChecklistItem[] };
}

export interface CTASection extends BaseSection {
  type: "cta";
  data: { title: string; description: string; email: string; whatsapp: string };
}

export type PaperSection =
  | TextSection
  | MetricsSection
  | ProTipSection
  | ProsConsSection
  | BulletListSection
  | BuyerProfilesSection
  | ChecklistSection
  | CTASection;

export const SECTION_LABELS: Record<SectionType, string> = {
  text: "Text Section",
  metrics: "Key Metrics",
  pro_tip: "Pro Tip",
  pros_cons: "Pros & Cons",
  bullet_list: "Bullet List",
  buyer_profiles: "Buyer Profiles",
  checklist: "Checklist",
  cta: "Call to Action",
};

export function createDefaultSection(type: SectionType): PaperSection {
  const id = crypto.randomUUID();
  switch (type) {
    case "text":
      return { id, type, data: { title: "", content: "" } };
    case "metrics":
      return { id, type, data: { title: "Market Overview", metrics: [{ label: "", value: "" }] } };
    case "pro_tip":
      return { id, type, data: { content: "" } };
    case "pros_cons":
      return { id, type, data: { greenFlags: [""], redFlags: [""] } };
    case "bullet_list":
      return { id, type, data: { title: "", items: [""] } };
    case "buyer_profiles":
      return {
        id,
        type,
        data: {
          idealBuyers: [{ label: "", description: "" }],
          cautionBuyers: [{ label: "", description: "" }],
        },
      };
    case "checklist":
      return {
        id,
        type,
        data: {
          phaseTitle: "",
          items: [{ task: "", priority: "important", timeline: "" }],
        },
      };
    case "cta":
      return {
        id,
        type,
        data: {
          title: "Thinking about making a move?",
          description: "Book a discovery call to get personalized guidance on your property journey in Portugal.",
          email: "services@kingsncompany.com",
          whatsapp: "",
        },
      };
  }
}

export function getDefaultSections(): PaperSection[] {
  return [
    createDefaultSection("text"),
    createDefaultSection("metrics"),
    createDefaultSection("text"),
    createDefaultSection("pro_tip"),
    createDefaultSection("pros_cons"),
    createDefaultSection("buyer_profiles"),
    createDefaultSection("bullet_list"),
    createDefaultSection("cta"),
  ];
}
