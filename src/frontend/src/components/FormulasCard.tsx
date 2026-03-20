import { BookOpen } from "lucide-react";

const FORMULAS = [
  {
    category: "Descriptive",
    items: [
      {
        name: "Estimate Proportion",
        formula: "n = z²(α/2) · p(1-p) / d²",
        desc: "Cochran (1977). p = expected proportion, d = margin of error",
      },
      {
        name: "Estimate Mean",
        formula: "n = z²(α/2) · σ² / d²",
        desc: "σ = population SD, d = margin of error",
      },
    ],
  },
  {
    category: "Analytic",
    items: [
      {
        name: "Two Proportions (Cohort)",
        formula: "n = [z_α√(2p̄q̄) + z_β√(p₁q₁+p₂q₂)]² / (p₁-p₂)²",
        desc: "Fleiss (1981). Per group. p̄ = pooled proportion",
      },
      {
        name: "Two Proportions (Case-Control)",
        formula: "p_case = OR·p_ctrl / [1+(OR-1)·p_ctrl]",
        desc: "Kelsey (1996). Derives case proportion from OR, then uses cohort formula",
      },
      {
        name: "Two Means",
        formula: "n = 2(z_α+z_β)² · σ² / Δ²",
        desc: "Two-sample t-test power. Δ = difference in means, σ = pooled SD",
      },
    ],
  },
  {
    category: "Clinical Trials",
    items: [
      {
        name: "Parallel RCT",
        formula: "n = 2(z_α+z_β)² · σ² / Δ² per arm",
        desc: "Superiority design. Use proportion formula for binary outcomes",
      },
      {
        name: "Non-Inferiority",
        formula: "n = 2(z_α+z_β)² · σ² / (δ-|μ₁-μ₂|)² per arm",
        desc: "δ = non-inferiority margin. One-sided testing convention",
      },
      {
        name: "Crossover",
        formula: "n = 2(z_α+z_β)² · σ_w² / Δ² per sequence",
        desc: "σ_w = within-subject SD (typically < between-subject SD)",
      },
    ],
  },
];

export function FormulasCard() {
  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <BookOpen className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Key Statistical Formulas
        </h2>
      </div>

      <div className="space-y-6">
        {FORMULAS.map((section) => (
          <div key={section.category}>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
              {section.category}
            </p>
            <div className="space-y-3">
              {section.items.map((item) => (
                <div key={item.name} className="rounded-xl bg-background p-4">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {item.name}
                  </p>
                  <code className="block text-sm font-mono text-primary bg-primary/5 rounded px-2 py-1.5 mb-2">
                    {item.formula}
                  </code>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
