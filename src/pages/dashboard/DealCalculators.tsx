import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Save } from "lucide-react";

export default function DealCalculators() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchasePrice, setPurchasePrice] = useState("");
  const [renovationCost, setRenovationCost] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [saving, setSaving] = useState(false);

  const pp = parseFloat(purchasePrice) || 0;
  const rc = parseFloat(renovationCost) || 0;
  const mr = parseFloat(monthlyRent) || 0;
  const totalInvestment = pp + rc;
  const annualRent = mr * 12;
  const grossYield = totalInvestment > 0 ? (annualRent / totalInvestment) * 100 : 0;
  const monthlyCashFlow = mr - (totalInvestment > 0 ? (totalInvestment * 0.04) / 12 : 0); // Assume 4% annual costs
  const roi = totalInvestment > 0 ? ((annualRent - totalInvestment * 0.04) / totalInvestment) * 100 : 0;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("deal_calculators").insert({
      user_id: user.id,
      purchase_price: pp,
      renovation_cost: rc,
      monthly_rent: mr,
      yield: grossYield,
      roi,
      cash_flow: monthlyCashFlow,
    });
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Deal saved", description: "Your analysis has been saved." });
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-serif text-3xl font-semibold text-foreground">Deal Calculator</h1>
      <p className="mt-2 text-sm text-muted-foreground">Analyze property investment returns.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="font-serif text-lg font-semibold text-foreground">Input</h2>
          <div>
            <Label>Purchase Price (€)</Label>
            <Input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="mt-1 font-mono" placeholder="250000" />
          </div>
          <div>
            <Label>Renovation Cost (€)</Label>
            <Input type="number" value={renovationCost} onChange={(e) => setRenovationCost(e.target.value)} className="mt-1 font-mono" placeholder="30000" />
          </div>
          <div>
            <Label>Monthly Rent (€)</Label>
            <Input type="number" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} className="mt-1 font-mono" placeholder="1500" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-serif text-lg font-semibold text-foreground">Results</h2>
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Investment</span>
              <span className="font-mono text-sm font-semibold text-foreground">€{totalInvestment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Annual Rent</span>
              <span className="font-mono text-sm text-foreground">€{annualRent.toLocaleString()}</span>
            </div>
            <div className="border-t border-border pt-4 flex justify-between">
              <span className="text-sm text-muted-foreground">Gross Yield</span>
              <span className="font-mono text-lg font-bold text-primary">{grossYield.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Net ROI (est.)</span>
              <span className={`font-mono text-sm font-semibold ${roi > 0 ? "text-green-400" : "text-red-400"}`}>{roi.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Monthly Cash Flow</span>
              <span className={`font-mono text-sm font-semibold ${monthlyCashFlow > 0 ? "text-green-400" : "text-red-400"}`}>€{monthlyCashFlow.toFixed(0)}</span>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving || totalInvestment === 0} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving…" : "Save Analysis"}
          </Button>
        </div>
      </div>
    </div>
  );
}
