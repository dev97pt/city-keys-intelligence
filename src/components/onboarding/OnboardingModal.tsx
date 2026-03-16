import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

const steps = [
  {
    title: "Welcome to Keys to the City",
    subtitle: "The platform helps internationals relocate and invest abroad. Let's personalize your experience.",
    type: "welcome" as const,
  },
  {
    title: "Where are you in your journey?",
    type: "select" as const,
    field: "relocation_stage",
    options: ["Researching", "Moving in 6–12 months", "Already abroad", "Buying property soon"],
  },
  {
    title: "What is your main goal?",
    type: "select" as const,
    field: "main_goal",
    options: ["Buy property", "Invest internationally", "Relocate lifestyle", "Start a business"],
  },
  {
    title: "Which country interests you most?",
    type: "country" as const,
    field: "target_country_id",
  },
  {
    title: "Which city interests you most?",
    type: "city" as const,
    field: "target_city_id",
  },
  {
    title: "You're all set!",
    subtitle: "We've personalized your dashboard. Here are some resources to get started.",
    type: "complete" as const,
  },
];

interface Country {
  id: string;
  name: string;
  is_active: boolean;
}

interface City {
  id: string;
  name: string;
}

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);

  const current = steps[step];

  const fetchCountries = async () => {
    const { data } = await supabase.from("countries").select("id, name, is_active").order("name");
    if (data) setCountries(data);
  };

  const fetchCities = async (countryId: string) => {
    const { data } = await supabase.from("cities").select("id, name").eq("country_id", countryId).order("name");
    if (data) setCities(data);
  };

  const handleSelect = async (value: string, field?: string) => {
    if (!field) return;
    const newSelections = { ...selections, [field]: value };
    setSelections(newSelections);

    if (field === "target_country_id") {
      await fetchCities(value);
    }
  };

  const handleNext = async () => {
    if (step === 0) {
      await fetchCountries();
    }

    if (step === steps.length - 1) {
      // Save all selections to profile
      setLoading(true);
      const updateData: Record<string, unknown> = { onboarding_completed: true };
      if (selections.relocation_stage) updateData.relocation_stage = selections.relocation_stage;
      if (selections.main_goal) updateData.main_goal = selections.main_goal;
      if (selections.target_country_id) updateData.target_country_id = selections.target_country_id;
      if (selections.target_city_id) updateData.target_city_id = selections.target_city_id;

      await supabase.from("profiles").update(updateData).eq("id", user?.id);
      setLoading(false);
      onComplete();
      return;
    }

    setStep(step + 1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-md rounded-lg border border-border bg-card p-8"
      >
        {/* Progress */}
        <div className="mb-8 flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        <h2 className="font-serif text-2xl font-semibold text-foreground">{current.title}</h2>
        {current.subtitle && (
          <p className="mt-2 text-sm text-muted-foreground">{current.subtitle}</p>
        )}

        {current.type === "select" && (
          <div className="mt-6 space-y-2">
            {current.options?.map((opt) => (
              <button
                key={opt}
                onClick={() => handleSelect(opt, current.field)}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  selections[current.field!] === opt
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-border hover:bg-secondary"
                }`}
              >
                {opt}
                {selections[current.field!] === opt && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        )}

        {current.type === "country" && (
          <div className="mt-6 space-y-2">
            {countries.map((c) => (
              <button
                key={c.id}
                onClick={() => c.is_active && handleSelect(c.id, "target_country_id")}
                disabled={!c.is_active}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  !c.is_active
                    ? "cursor-not-allowed border-border/30 text-muted-foreground/50"
                    : selections.target_country_id === c.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                <span>{c.name}</span>
                {!c.is_active && <span className="text-xs text-muted-foreground/50">Coming Soon</span>}
                {selections.target_country_id === c.id && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        )}

        {current.type === "city" && (
          <div className="mt-6 space-y-2">
            {cities.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c.id, "target_city_id")}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  selections.target_city_id === c.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary"
                }`}
              >
                {c.name}
                {selections.target_city_id === c.id && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        )}

        {current.type === "complete" && (
          <div className="mt-6 space-y-3">
            {["City Papers for your target city", "Neighborhood Investment Map", "Property Deal Calculator"].map((r) => (
              <div key={r} className="flex items-center gap-3 rounded-lg border border-border/50 bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary shrink-0" />
                {r}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          {step > 0 && step < steps.length - 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={loading || (current.type === "select" && !selections[current.field!]) || (current.type === "country" && !selections.target_country_id) || (current.type === "city" && !selections.target_city_id)}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {step === steps.length - 1 ? (loading ? "Setting up…" : "Go to Dashboard") : "Continue"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
