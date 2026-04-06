import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PaperSection,
  SectionType,
  SECTION_LABELS,
  createDefaultSection,
  MetricItem,
  BuyerProfileItem,
  ChecklistItem,
} from "@/types/cityPaperSections";
import { GripVertical, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface SectionBuilderProps {
  sections: PaperSection[];
  onChange: (sections: PaperSection[]) => void;
}

export function SectionBuilder({ sections, onChange }: SectionBuilderProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  const update = (id: string, data: any) => {
    onChange(sections.map(s => (s.id === id ? { ...s, data } : s)));
  };

  const remove = (id: string) => onChange(sections.filter(s => s.id !== id));

  const moveUp = (i: number) => {
    if (i === 0) return;
    const arr = [...sections];
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    onChange(arr);
  };

  const moveDown = (i: number) => {
    if (i >= sections.length - 1) return;
    const arr = [...sections];
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    onChange(arr);
  };

  const addSection = (type: SectionType) => {
    onChange([...sections, createDefaultSection(type)]);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Sections</Label>
      {sections.map((section, idx) => (
        <div key={section.id} className="rounded-lg border border-border bg-secondary/30 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-foreground flex-1">
              {SECTION_LABELS[section.type]}
            </span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveUp(idx)}>
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => moveDown(idx)}>
              <ChevronDown className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggle(section.id)}>
              {collapsed[section.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => remove(section.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          {!collapsed[section.id] && (
            <div className="p-3 space-y-3">
              <SectionEditor section={section} onUpdate={(data) => update(section.id, data)} />
            </div>
          )}
        </div>
      ))}

      <div className="pt-2">
        <Select onValueChange={(v) => addSection(v as SectionType)}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" />
              <SelectValue placeholder="Add Section" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SECTION_LABELS) as SectionType[]).map(type => (
              <SelectItem key={type} value={type}>{SECTION_LABELS[type]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SectionEditor({ section, onUpdate }: { section: PaperSection; onUpdate: (data: any) => void }) {
  const d = section.data as any;

  switch (section.type) {
    case "text":
      return (
        <>
          <Input placeholder="Section title" value={d.title} onChange={e => onUpdate({ ...d, title: e.target.value })} />
          <Textarea placeholder="Content…" value={d.content} onChange={e => onUpdate({ ...d, content: e.target.value })} rows={5} className="text-xs" />
        </>
      );

    case "metrics":
      return (
        <>
          <Input placeholder="Section title" value={d.title} onChange={e => onUpdate({ ...d, title: e.target.value })} />
          {(d.metrics as MetricItem[]).map((m, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder="Label" value={m.label} className="flex-1" onChange={e => {
                const metrics = [...d.metrics]; metrics[i] = { ...m, label: e.target.value }; onUpdate({ ...d, metrics });
              }} />
              <Input placeholder="Value" value={m.value} className="flex-1" onChange={e => {
                const metrics = [...d.metrics]; metrics[i] = { ...m, value: e.target.value }; onUpdate({ ...d, metrics });
              }} />
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-destructive shrink-0" onClick={() => {
                onUpdate({ ...d, metrics: d.metrics.filter((_: any, j: number) => j !== i) });
              }}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => onUpdate({ ...d, metrics: [...d.metrics, { label: "", value: "" }] })}>
            <Plus className="h-3 w-3 mr-1" /> Add Metric
          </Button>
        </>
      );

    case "pro_tip":
      return <Textarea placeholder="Pro tip insight…" value={d.content} onChange={e => onUpdate({ content: e.target.value })} rows={3} className="text-xs" />;

    case "pros_cons":
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-emerald-400">Green Flags</Label>
            {(d.greenFlags as string[]).map((f: string, i: number) => (
              <div key={i} className="flex gap-1">
                <Input value={f} className="text-xs" onChange={e => {
                  const arr = [...d.greenFlags]; arr[i] = e.target.value; onUpdate({ ...d, greenFlags: arr });
                }} />
                <Button variant="ghost" size="sm" className="h-10 w-8 p-0 text-destructive shrink-0" onClick={() => {
                  onUpdate({ ...d, greenFlags: d.greenFlags.filter((_: any, j: number) => j !== i) });
                }}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => onUpdate({ ...d, greenFlags: [...d.greenFlags, ""] })}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-red-400">Red Flags</Label>
            {(d.redFlags as string[]).map((f: string, i: number) => (
              <div key={i} className="flex gap-1">
                <Input value={f} className="text-xs" onChange={e => {
                  const arr = [...d.redFlags]; arr[i] = e.target.value; onUpdate({ ...d, redFlags: arr });
                }} />
                <Button variant="ghost" size="sm" className="h-10 w-8 p-0 text-destructive shrink-0" onClick={() => {
                  onUpdate({ ...d, redFlags: d.redFlags.filter((_: any, j: number) => j !== i) });
                }}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => onUpdate({ ...d, redFlags: [...d.redFlags, ""] })}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
        </div>
      );

    case "bullet_list":
      return (
        <>
          <Input placeholder="Section title" value={d.title} onChange={e => onUpdate({ ...d, title: e.target.value })} />
          {(d.items as string[]).map((item: string, i: number) => (
            <div key={i} className="flex gap-1">
              <Input value={item} className="text-xs" onChange={e => {
                const items = [...d.items]; items[i] = e.target.value; onUpdate({ ...d, items });
              }} />
              <Button variant="ghost" size="sm" className="h-10 w-8 p-0 text-destructive shrink-0" onClick={() => {
                onUpdate({ ...d, items: d.items.filter((_: any, j: number) => j !== i) });
              }}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => onUpdate({ ...d, items: [...d.items, ""] })}>
            <Plus className="h-3 w-3 mr-1" /> Add Item
          </Button>
        </>
      );

    case "buyer_profiles":
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs text-primary">Ideal Buyers</Label>
            {(d.idealBuyers as BuyerProfileItem[]).map((b, i) => (
              <div key={i} className="space-y-1">
                <Input placeholder="Profile label" value={b.label} className="text-xs" onChange={e => {
                  const arr = [...d.idealBuyers]; arr[i] = { ...b, label: e.target.value }; onUpdate({ ...d, idealBuyers: arr });
                }} />
                <Input placeholder="Description" value={b.description} className="text-xs" onChange={e => {
                  const arr = [...d.idealBuyers]; arr[i] = { ...b, description: e.target.value }; onUpdate({ ...d, idealBuyers: arr });
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => onUpdate({ ...d, idealBuyers: [...d.idealBuyers, { label: "", description: "" }] })}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-yellow-400">Caution Buyers</Label>
            {(d.cautionBuyers as BuyerProfileItem[]).map((b, i) => (
              <div key={i} className="space-y-1">
                <Input placeholder="Profile label" value={b.label} className="text-xs" onChange={e => {
                  const arr = [...d.cautionBuyers]; arr[i] = { ...b, label: e.target.value }; onUpdate({ ...d, cautionBuyers: arr });
                }} />
                <Input placeholder="Description" value={b.description} className="text-xs" onChange={e => {
                  const arr = [...d.cautionBuyers]; arr[i] = { ...b, description: e.target.value }; onUpdate({ ...d, cautionBuyers: arr });
                }} />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => onUpdate({ ...d, cautionBuyers: [...d.cautionBuyers, { label: "", description: "" }] })}>
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
        </div>
      );

    case "checklist":
      return (
        <>
          <Input placeholder="Phase title (e.g. Before Arrival (30 Days Out))" value={d.phaseTitle} onChange={e => onUpdate({ ...d, phaseTitle: e.target.value })} />
          {(d.items as ChecklistItem[]).map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Input placeholder="Task" value={item.task} className="flex-1 text-xs" onChange={e => {
                const items = [...d.items]; items[i] = { ...item, task: e.target.value }; onUpdate({ ...d, items });
              }} />
              <Select value={item.priority} onValueChange={v => {
                const items = [...d.items]; items[i] = { ...item, priority: v }; onUpdate({ ...d, items });
              }}>
                <SelectTrigger className="w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="optional">Optional</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Timeline" value={item.timeline} className="w-28 text-xs" onChange={e => {
                const items = [...d.items]; items[i] = { ...item, timeline: e.target.value }; onUpdate({ ...d, items });
              }} />
              <Button variant="ghost" size="sm" className="h-10 w-8 p-0 text-destructive shrink-0" onClick={() => {
                onUpdate({ ...d, items: d.items.filter((_: any, j: number) => j !== i) });
              }}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => onUpdate({ ...d, items: [...d.items, { task: "", priority: "important", timeline: "" }] })}>
            <Plus className="h-3 w-3 mr-1" /> Add Item
          </Button>
        </>
      );

    case "cta":
      return (
        <>
          <Input placeholder="CTA Title" value={d.title} onChange={e => onUpdate({ ...d, title: e.target.value })} />
          <Textarea placeholder="Description" value={d.description} onChange={e => onUpdate({ ...d, description: e.target.value })} rows={2} className="text-xs" />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Email" value={d.email} onChange={e => onUpdate({ ...d, email: e.target.value })} />
            <Input placeholder="WhatsApp number" value={d.whatsapp} onChange={e => onUpdate({ ...d, whatsapp: e.target.value })} />
          </div>
        </>
      );
  }
}
