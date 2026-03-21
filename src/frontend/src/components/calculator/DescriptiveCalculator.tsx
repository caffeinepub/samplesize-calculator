import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudyType, SubType, useSaveCalculation } from "@/hooks/useQueries";
import {
  applyFPC,
  calcEstimateMean,
  calcEstimateProportion,
  getZAlpha,
} from "@/utils/sampleSizeFormulas";
import { useState } from "react";
import { ResultsPanel } from "../ResultsPanel";

// t-distribution quantile using Cornish-Fisher / iterative approximation
function tQuantile(p: number, df: number): number {
  // p = upper-tail probability (e.g. 0.025 for 95% CI)
  // Use iterative approximation via the beta distribution inverse
  // For practical df >= 1, we use a reliable rational approximation
  if (df <= 0) return Number.POSITIVE_INFINITY;
  // Normal quantile approximation seed
  const z = normalQuantile(p);
  if (df >= 1000) return z;

  // Iterative improvement using the t-distribution CDF inversion
  // We'll use the simple but accurate approximation method:
  // t ≈ z * (1 + (z^2+1)/(4*df) + (5*z^4+16*z^2+3)/(96*df^2))
  const z2 = z * z;
  const t =
    z *
    (1 +
      (z2 + 1) / (4 * df) +
      (5 * z2 * z2 + 16 * z2 + 3) / (96 * df * df) +
      (3 * z2 * z2 * z2 + 19 * z2 * z2 + 17 * z2 - 15) / (384 * df * df * df));
  return t;
}

function normalQuantile(p: number): number {
  // Rational approximation for the normal quantile (Beasley-Springer-Moro)
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q: number;
  if (p < pLow) {
    const r = Math.sqrt(-2 * Math.log(p));
    q =
      (((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) /
      ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1);
  } else if (p <= pHigh) {
    const r = p - 0.5;
    const s = r * r;
    q =
      ((((((a[0] * s + a[1]) * s + a[2]) * s + a[3]) * s + a[4]) * s + a[5]) *
        r) /
      (((((b[0] * s + b[1]) * s + b[2]) * s + b[3]) * s + b[4]) * s + 1);
  } else {
    const r = Math.sqrt(-2 * Math.log(1 - p));
    q = -(
      (((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) /
      ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1)
    );
  }
  return q;
}

interface IterationStep {
  iteration: number;
  df: number;
  t: number;
  n: number;
}

function iterateSampleSize(
  confidenceLevel: string,
  s: number,
  d: number,
): { finalN: number; steps: IterationStep[] } {
  const alpha = 1 - Number(confidenceLevel) / 100;
  const p = alpha / 2; // upper tail probability
  const steps: IterationStep[] = [];

  // Step 0: initial estimate using z
  const z = getZAlpha(confidenceLevel);
  let nPrev = Math.ceil((z * z * s * s) / (d * d));
  if (nPrev < 2) nPrev = 2;

  for (let i = 1; i <= 20; i++) {
    const df = nPrev - 1;
    const t = tQuantile(p, df);
    const nNew = Math.ceil((t * t * s * s) / (d * d));
    steps.push({
      iteration: i,
      df,
      t: Number.parseFloat(t.toFixed(4)),
      n: nNew,
    });
    if (nNew === nPrev) break;
    nPrev = nNew;
  }

  return { finalN: steps[steps.length - 1].n, steps };
}

export function DescriptiveCalculator() {
  const [subType, setSubType] = useState<"proportion" | "mean">("proportion");
  const [confidenceLevel, setConfidenceLevel] = useState("95");
  const [p, setP] = useState("");
  const [d, setD] = useState("");
  const [sigma, setSigma] = useState("");
  const [population, setPopulation] = useState("");
  const [sdUnknown, setSdUnknown] = useState(false);
  const [iterSteps, setIterSteps] = useState<IterationStep[]>([]);
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const save = useSaveCalculation();

  const parsedN =
    population.trim() !== "" ? Number.parseInt(population, 10) : null;
  const hasFPC = parsedN !== null && !Number.isNaN(parsedN) && parsedN > 0;

  function handleCalculate() {
    setLoading(true);
    let n = 0;
    let desc = "";
    let st = SubType.estimateProportion;
    try {
      if (subType === "proportion") {
        const pv = Number.parseFloat(p);
        const dv = Number.parseFloat(d);
        if (
          Number.isNaN(pv) ||
          Number.isNaN(dv) ||
          pv <= 0 ||
          pv >= 1 ||
          dv <= 0
        )
          return;
        n = calcEstimateProportion(confidenceLevel, pv, dv);
        if (hasFPC) n = applyFPC(n, parsedN as number);
        desc = `CL=${confidenceLevel}%, p=${pv}, d=${dv}`;
        if (hasFPC) desc += `, N=${parsedN}`;
        st = SubType.estimateProportion;
        setIterSteps([]);
      } else {
        const sv = Number.parseFloat(sigma);
        const dv = Number.parseFloat(d);
        if (Number.isNaN(sv) || Number.isNaN(dv) || sv <= 0 || dv <= 0) return;
        if (sdUnknown) {
          const { finalN, steps } = iterateSampleSize(confidenceLevel, sv, dv);
          n = finalN;
          if (hasFPC) n = applyFPC(n, parsedN as number);
          setIterSteps(steps);
          desc = `CL=${confidenceLevel}%, s=${sv}, d=${dv} (t-iteration)`;
        } else {
          n = calcEstimateMean(confidenceLevel, sv, dv);
          if (hasFPC) n = applyFPC(n, parsedN as number);
          setIterSteps([]);
          desc = `CL=${confidenceLevel}%, sigma=${sv}, d=${dv}`;
        }
        if (hasFPC) desc += `, N=${parsedN}`;
        st = SubType.estimateMean;
      }
      setResult(n);
      save.mutate({
        studyType: StudyType.descriptive,
        subType: st,
        inputDescription: desc,
        resultN: n,
      });
    } finally {
      setLoading(false);
    }
  }

  const za = getZAlpha(confidenceLevel).toFixed(3);
  const components =
    result !== null
      ? [
          subType === "mean" && sdUnknown
            ? { label: "Method", value: "t-distribution (iteration)" }
            : { label: "z(alpha/2)", value: za },
          subType === "proportion"
            ? { label: "p", value: p }
            : { label: sdUnknown ? "s (sample SD)" : "sigma", value: sigma },
          { label: "d (margin)", value: d },
          ...(hasFPC ? [{ label: "N (population)", value: population }] : []),
          { label: "n", value: String(result) },
        ]
      : [];

  const baseFormula =
    subType === "proportion"
      ? "n = z^2 x p x (1-p) / d^2"
      : sdUnknown
        ? "n₀ = z²s²/d²  →  nᵢ = t²(α/2, nᵢ₋₁-1)·s²/d²  (iterate until convergence)"
        : "n = z^2 x sigma^2 / d^2";
  const formula = hasFPC
    ? `${baseFormula}  ->  n_adj = n / (1 + (n-1)/N)`
    : baseFormula;

  const baseMethodology =
    subType === "proportion"
      ? "Uses the Cochran (1977) formula for estimating a single proportion. Assumes a simple random sample with normal approximation. Requires p (expected proportion) and d (acceptable margin of error)."
      : sdUnknown
        ? "Population SD is unknown; uses an iterative t-distribution approach. Start with a z-based estimate n₀, then replace z with t(α/2, n-1) and recompute n until the value converges. Requires s (estimated/pilot sample SD) and d (margin of error)."
        : "Uses the formula for estimating a population mean. Requires sigma (population/pilot standard deviation) and d (margin of error). Normal approximation is assumed.";
  const methodology = hasFPC
    ? `${baseMethodology} Finite Population Correction (FPC) applied: n_adj = n / (1 + (n-1)/N) for population N=${parsedN}.`
    : baseMethodology;

  const populationField = (
    <div>
      <Label className="text-sm font-semibold text-foreground">
        Population Size (N)
      </Label>
      <p className="text-xs text-muted-foreground mb-1">
        Leave blank for infinite population
      </p>
      <Input
        data-ocid="descriptive.population.input"
        type="number"
        min="1"
        step="1"
        placeholder="e.g. 1000"
        value={population}
        onChange={(e) => setPopulation(e.target.value)}
      />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <Tabs
          value={subType}
          onValueChange={(v) => {
            setSubType(v as "proportion" | "mean");
            setResult(null);
            setIterSteps([]);
          }}
        >
          <TabsList className="mb-4 w-full">
            <TabsTrigger
              value="proportion"
              data-ocid="descriptive.proportion.tab"
              className="flex-1 text-white data-[state=inactive]:text-white"
            >
              Estimate a Proportion
            </TabsTrigger>
            <TabsTrigger
              value="mean"
              data-ocid="descriptive.mean.tab"
              className="flex-1 text-white data-[state=inactive]:text-white"
            >
              Estimate a Mean
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proportion" className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Confidence Level
              </Label>
              <Select
                value={confidenceLevel}
                onValueChange={setConfidenceLevel}
              >
                <SelectTrigger
                  data-ocid="descriptive.confidence.select"
                  className="mt-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90%</SelectItem>
                  <SelectItem value="95">95%</SelectItem>
                  <SelectItem value="99">99%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Expected Proportion (p)
              </Label>
              <p className="text-xs text-muted-foreground mb-1">
                Value between 0 and 1
              </p>
              <Input
                data-ocid="descriptive.proportion.input"
                type="number"
                min="0.01"
                max="0.99"
                step="0.01"
                placeholder="0.5"
                value={p}
                onChange={(e) => setP(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Margin of Error (d)
              </Label>
              <p className="text-xs text-muted-foreground mb-1">
                Acceptable margin as proportion (e.g. 0.05 = +/-5%)
              </p>
              <Input
                data-ocid="descriptive.margin.input"
                type="number"
                min="0.001"
                max="0.5"
                step="0.001"
                placeholder="0.05"
                value={d}
                onChange={(e) => setD(e.target.value)}
              />
            </div>
            {populationField}
          </TabsContent>

          <TabsContent value="mean" className="space-y-4">
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Confidence Level
              </Label>
              <Select
                value={confidenceLevel}
                onValueChange={(v) => {
                  setConfidenceLevel(v);
                  setResult(null);
                  setIterSteps([]);
                }}
              >
                <SelectTrigger
                  data-ocid="descriptive.confidence_mean.select"
                  className="mt-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90%</SelectItem>
                  <SelectItem value="95">95%</SelectItem>
                  <SelectItem value="99">99%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SD known / unknown toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
              <button
                type="button"
                role="switch"
                aria-checked={sdUnknown}
                onClick={() => {
                  setSdUnknown(!sdUnknown);
                  setResult(null);
                  setIterSteps([]);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  sdUnknown ? "bg-primary" : "bg-input"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                    sdUnknown ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {sdUnknown ? "SD Unknown" : "SD Known"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sdUnknown
                    ? "Uses t-distribution with iterative method"
                    : "Uses normal (z) distribution"}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold text-foreground">
                {sdUnknown
                  ? "Estimated Sample SD (s)"
                  : "Expected Standard Deviation (sigma)"}
              </Label>
              {sdUnknown && (
                <p className="text-xs text-muted-foreground mb-1">
                  From pilot study or prior literature
                </p>
              )}
              <Input
                data-ocid="descriptive.sigma.input"
                type="number"
                min="0"
                step="0.1"
                placeholder="10"
                value={sigma}
                onChange={(e) => setSigma(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Margin of Error (d)
              </Label>
              <Input
                data-ocid="descriptive.margin_mean.input"
                type="number"
                min="0"
                step="0.1"
                placeholder="2"
                value={d}
                onChange={(e) => setD(e.target.value)}
              />
            </div>
            {populationField}
          </TabsContent>
        </Tabs>

        <Button
          type="button"
          data-ocid="descriptive.calculate.button"
          onClick={handleCalculate}
          className="w-full mt-2 bg-primary hover:bg-primary/90 text-black font-semibold"
          disabled={loading}
        >
          Calculate Sample Size
        </Button>
      </div>

      <div className="space-y-4">
        <ResultsPanel
          resultN={result}
          perGroup={false}
          formula={formula}
          methodology={methodology}
          components={components}
          isLoading={loading}
        />

        {/* Iteration table */}
        {iterSteps.length > 0 && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">
              Iteration Steps (t-distribution convergence)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1 px-2 font-semibold text-foreground">
                      Iteration
                    </th>
                    <th className="text-left py-1 px-2 font-semibold text-foreground">
                      df (n-1)
                    </th>
                    <th className="text-left py-1 px-2 font-semibold text-foreground">
                      t(α/2, df)
                    </th>
                    <th className="text-left py-1 px-2 font-semibold text-foreground">
                      n
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {iterSteps.map((step) => (
                    <tr
                      key={step.iteration}
                      className={`border-b border-border/50 ${
                        step.iteration ===
                        iterSteps[iterSteps.length - 1].iteration
                          ? "bg-primary/10 font-bold"
                          : ""
                      }`}
                    >
                      <td className="py-1 px-2 text-foreground">
                        {step.iteration}
                      </td>
                      <td className="py-1 px-2 text-foreground">{step.df}</td>
                      <td className="py-1 px-2 text-foreground">{step.t}</td>
                      <td className="py-1 px-2 text-foreground">{step.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Final converged sample size highlighted. z-seed: n₀ = {(() => {
                const z = getZAlpha(confidenceLevel);
                const sv = Number.parseFloat(sigma);
                const dv = Number.parseFloat(d);
                if (!Number.isNaN(sv) && !Number.isNaN(dv) && dv > 0)
                  return Math.ceil((z * z * sv * sv) / (dv * dv));
                return "?";
              })()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
