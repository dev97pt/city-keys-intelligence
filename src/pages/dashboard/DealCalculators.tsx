import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Info, Save } from "lucide-react";
import { computeDeal } from "@/lib/dealMath";

const eur = (n: number) => "€" + Math.round(n).toLocaleString("en-US");
const toNum = (s: string) => parseFloat(s.replace(/[^\d.]/g, "")) || 0;

function MoneyInput({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; hint?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative mt-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
        <Input
          inputMode="numeric"
          value={value ? Number(toNum(value)).toLocaleString("en-US") : ""}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
          className="pl-7 font-mono tabular-nums"
          placeholder={placeholder}
        />
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PctInput({ label, value, onChange, max = 100 }: { label: string; value: string; onChange: (v: string) => void; max?: number }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type="number" min={0} max={max} step="0.1" value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 font-mono tabular-nums" />
    </div>
  );
}

export default function DealCalculators() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [price, setPrice] = useState("");
  const [renovation, setRenovation] = useState("");
  const [rent, setRent] = useState("");
  const [costRate, setCostRate] = useState("4");
  const [tax, setTax] = useState("7");
  const [ltv, setLtv] = useState("0");
  const [interest, setInterest] = useState("3.5");
  const [years, setYears] = useState("30");
  const [saving, setSaving] = useState(false);

  const d = computeDeal({
    price: toNum(price), renovation: toNum(renovation), monthlyRent: toNum(rent),
    costRate: toNum(costRate), acquisitionTax: toNum(tax), ltv: Math.min(toNum(ltv), 100),
    interest: toNum(interest), years: toNum(years),
  });
  const ready = toNum(price) > 0 && toNum(rent) > 0;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("deal_calculators").insert({
      user_id: user.id, purchase_price: toNum(price), renovation_cost: toNum(renovation), monthly_rent: toNum(rent),
      yield: d.grossYield, roi: d.roi, cash_flow: d.monthlyCashFlow,
    });
    setSaving(false);
    if (error) toast({ variant: "destructive", title: "Couldn't save", description: error.message });
    else toast({ title: "Deal saved", description: "Your analysis has been saved." });
  };

  const tone = (n: number) => (n > 0 ? "text-primary" : "text-destructive");

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-3xl font-semibold text-foreground">Deal Calculator</h1>
        <p className="mt-2 text-sm text-muted-foreground">Estimate yield, cash flow and return on a property in Portugal.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Property</h2>
            <MoneyInput label="Purchase price" value={price} onChange={setPrice} placeholder="250,000" />
            <MoneyInput label="Renovation cost" value={renovation} onChange={setRenovation} placeholder="30,000" hint="Leave empty if move-in ready." />
            <MoneyInput label="Expected monthly rent" value={rent} onChange={setRent} placeholder="1,500" />

            <Collapsible className="rounded-lg border border-border">
              <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3 text-sm text-foreground">
                Advanced assumptions
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="grid grid-cols-2 gap-3 px-4 pb-4">
                <PctInput label="Purchase taxes (IMT + stamp) %" value={tax} onChange={setTax} />
                <PctInput label="Annual running costs %" value={costRate} onChange={setCostRate} />
                <PctInput label="Mortgage (loan-to-value) %" value={ltv} onChange={setLtv} />
                <PctInput label="Interest rate %" value={interest} onChange={setInterest} max={20} />
                <PctInput label="Loan term (years)" value={years} onChange={setYears} max={40} />
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Results</h2>
            {!ready ? (
              <div className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
                Enter a purchase price and monthly rent to see your returns.
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border border-border bg-card p-6 font-mono text-sm tabular-nums">
                <Row label="Purchase taxes" value={eur(d.taxes)} />
                <Row label="Total investment" value={eur(d.totalInvestment)} strong />
                {d.loan > 0 && <Row label="Mortgage payment / mo" value={eur(d.mortgage)} />}
                <Row label="Your cash invested" value={eur(d.cashInvested)} />
                <Row label="Annual rent" value={eur(d.annualRent)} />
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="font-sans text-muted-foreground">Gross yield</span>
                  <span className="text-lg font-bold text-primary">{d.grossYield.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1 font-sans text-muted-foreground">
                    Net return on cash
                    <Tooltip>
                      <TooltipTrigger aria-label="How this is calculated"><Info className="h-3.5 w-3.5" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs font-sans">
                        Yearly rent minus running costs ({costRate}% of investment per year: property tax, condo fees, maintenance) and mortgage payments, divided by the cash you put in.
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <span className={`font-semibold ${tone(d.roi)}`}>{d.roi.toFixed(1)}%</span>
                </div>
                <Row label="Monthly cash flow" value={eur(d.monthlyCashFlow)} className={tone(d.monthlyCashFlow)} />
              </div>
            )}
            <Button onClick={handleSave} disabled={saving || !ready} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving…" : "Save analysis"}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function Row({ label, value, strong, className = "" }: { label: string; value: string; strong?: boolean; className?: string }) {
  return (
    <div className="flex justify-between">
      <span className="font-sans text-muted-foreground">{label}</span>
      <span className={`${strong ? "font-semibold text-foreground" : "text-foreground"} ${className}`}>{value}</span>
    </div>
  );
}
