import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

interface QuizAnswers {
  goal: string;
  budget: string;
  priority: string;
  environment: string;
  region: string;
}

const questions = [
  {
    key: "goal" as const,
    title: "What is your main goal?",
    subtitle: "This helps us prioritise the right neighborhoods for you.",
    options: [
      { value: "investment", label: "Investment", desc: "Maximise returns and capital growth" },
      { value: "lifestyle", label: "Lifestyle", desc: "Quality of life and daily experience" },
      { value: "balanced", label: "Balanced", desc: "Best of both worlds" },
    ],
  },
  {
    key: "budget" as const,
    title: "What's your budget level?",
    subtitle: "We'll filter neighborhoods that match your price range.",
    options: [
      { value: "low", label: "Entry Level", desc: "Under €2,500/m²" },
      { value: "medium", label: "Mid Range", desc: "€2,500 – €5,000/m²" },
      { value: "high", label: "Premium", desc: "Above €5,000/m²" },
    ],
  },
  {
    key: "priority" as const,
    title: "What matters most to you?",
    subtitle: "We'll boost areas that excel in your priority.",
    options: [
      { value: "yield", label: "Yield", desc: "High rental returns" },
      { value: "safety", label: "Safety", desc: "Low crime, family-friendly" },
      { value: "lifestyle", label: "Lifestyle", desc: "Culture, dining, nightlife" },
      { value: "transport", label: "Transport", desc: "Easy commute and connectivity" },
    ],
  },
  {
    key: "environment" as const,
    title: "What environment do you prefer?",
    subtitle: "Match the vibe that suits your personality.",
    options: [
      { value: "quiet", label: "Quiet & Residential", desc: "Calm, green, suburban feel" },
      { value: "trendy", label: "Trendy & Vibrant", desc: "Artsy, nightlife, energy" },
      { value: "premium", label: "Premium & Established", desc: "Upscale, polished, central" },
      { value: "up-and-coming", label: "Up-and-Coming", desc: "Emerging area, high potential" },
    ],
  },
  {
    key: "region" as const,
    title: "Which region interests you?",
    subtitle: "We cover full metropolitan areas, not just city centres.",
    options: [
      { value: "lisbon", label: "Lisbon Region", desc: "Lisbon, Cascais, Oeiras, Sintra & more" },
      { value: "porto", label: "Porto Region", desc: "Porto, Gaia, Matosinhos, Maia & more" },
      { value: "algarve", label: "Algarve", desc: "Faro, Lagos, Albufeira, Tavira & more" },
    ],
  },
];

interface Props {
  onComplete: (answers: QuizAnswers) => void;
}

export default function NeighborhoodQuiz({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});

  const q = questions[step];
  const selected = answers[q.key];
  const isLast = step === questions.length - 1;

  const select = (value: string) => {
    setAnswers((prev) => ({ ...prev, [q.key]: value }));
  };

  const next = () => {
    if (!selected) return;
    if (isLast) {
      onComplete(answers as QuizAnswers);
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>

      <p className="text-xs font-medium uppercase tracking-widest text-primary mb-2">
        Question {step + 1} of {questions.length}
      </p>

      <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground mb-2">
        {q.title}
      </h2>
      <p className="text-sm text-muted-foreground mb-8">{q.subtitle}</p>

      <div className="grid gap-3">
        {q.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => select(opt.value)}
            className={`group rounded-xl border p-5 text-left transition-all ${
              selected === opt.value
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/40"
            }`}
          >
            <span className="block text-sm font-semibold text-foreground">{opt.label}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{opt.desc}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="text-muted-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        <Button onClick={next} disabled={!selected} className="gap-2">
          {isLast ? (
            <>
              <Sparkles className="h-4 w-4" /> Find My Neighborhoods
            </>
          ) : (
            <>
              Next <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
