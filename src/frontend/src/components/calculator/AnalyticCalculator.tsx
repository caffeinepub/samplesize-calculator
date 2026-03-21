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
  calcCompareTwoMeans,
  calcCompareTwoProportionsCaseControl,
  calcCompareTwoProportionsCohort,
  getZAlpha,
  getZBeta,
} from "@/utils/sampleSizeFormulas";
import { useState } from "react";
import { ResultsPanel } from "../ResultsPanel";

type Sub = "cohort" | "casecontrol" | "means";

// ---- t-distribution helpers (same as DescriptiveCalculator) ----
function normalQuantile(p: number): number {
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

function tQuantile(p: number, df: number): number {
  if (df <= 0) return Number.POSITIVE_INFINITY;
  const z = normalQuantile(p);
  if (df >= 1000) return z;
  const z2 = z * z;
  const t =
    z *
    (1 +
      (z2 + 1) / (4 * df) +
      (5 * z2 * z2 + 16 * z2 + 3) / (96 * df * df) +
      (3 * z2 * z2 * z2 + 19 * z2 * z2 + 17 * z2 - 15) / (384 * df * df * df));
  return t;
}

interface IterationStep {
  iteration: number;
  df: number;
  t: number;
  n: number;
}

function iterateTwoMeans(
  confidenceLevel: string,
  power: string,
  s: number,
  delta: number,
): { finalN: number; steps: IterationStep[] } {
  const alpha = 1 - Number(confidenceLevel) / 100;
  const beta = 1 - Number(power) / 100;
  const pAlpha = alpha / 2;
  const pBeta = beta;
  const steps: IterationStep[] = [];

  const z_a = getZAlpha(confidenceLevel);
  const z_b = getZBeta(power);
  let nPrev = Math.ceil((2 * (z_a + z_b) ** 2 * s * s) / (delta * delta));
  if (nPrev < 2) nPrev = 2;

  for (let i = 1; i <= 20; i++) {
    const df = 2 * nPrev - 2;
    const t_a = tQuantile(pAlpha, df);
    const t_b = tQuantile(pBeta, df);
    const nNew = Math.ceil((2 * (t_a + t_b) ** 2 * s * s) / (delta * delta));
    steps.push({
      iteration: i,
      df,
      t: Number.parseFloat(t_a.toFixed(4)),
      n: nNew,
    });
    if (nNew === nPrev) break;
    nPrev = nNew;
  }

  return { finalN: steps[steps.length - 1].n, steps };
}

export function AnalyticCalculator() {
  const [sub, setSub] = useState<Sub>("cohort");
  const [confidenceLevel, setConfidenceLevel] = useState("95");
  const [power, setPower] = useState("80");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [ratio, setRatio] = useState("1");
  const [pControl, setPControl] = useState("");
  const [orVal, setOrVal] = useState("");
  const [mean1, setMean1] = useState("");
  const [mean2, setMean2] = useState("");
  const [pooledSD, setPooledSD] = useState("");
  const [sdUnknown, setSdUnknown] = useState(false);
  const [iterSteps, setIterSteps] = useState<IterationStep[]>([]);
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const save = useSaveCalculation();

  function handleCalculate() {
    setLoading(true);
    try {
      let n = 0;
      let desc = "";
      let st = SubType.compareTwoProportionsCohort;
      const r = Number.parseFloat(ratio) || 1;
      if (sub === "cohort") {
        const p1v = Number.parseFloat(p1);
        const p2v = Number.parseFloat(p2);
        if (Number.isNaN(p1v) || Number.isNaN(p2v)) return;
        n = calcCompareTwoProportionsCohort(
          confidenceLevel,
          power,
          p1v,
          p2v,
          r,
        );
        desc = `CL=${confidenceLevel}%, Power=${power}%, P1=${p1v}, P2=${p2v}, ratio=${r}`;
        st = SubType.compareTwoProportionsCohort;
        setIterSteps([]);
      } else if (sub === "casecontrol") {
        const pcv = Number.parseFloat(pControl);
        const orv = Number.parseFloat(orVal);
        if (Number.isNaN(pcv) || Number.isNaN(orv)) return;
        n = calcCompareTwoProportionsCaseControl(
          confidenceLevel,
          power,
          pcv,
          orv,
          r,
        );
        desc = `CL=${confidenceLevel}%, Power=${power}%, pCtrl=${pcv}, OR=${orv}, ratio=${r}`;
        st = SubType.compareTwoProportionsCaseControl;
        setIterSteps([]);
      } else {
        const m1 = Number.parseFloat(mean1);
        const m2 = Number.parseFloat(mean2);
        const sd = Number.parseFloat(pooledSD);
        if (Number.isNaN(m1) || Number.isNaN(m2) || Number.isNaN(sd)) return;
        const delta = Math.abs(m1 - m2);
        if (sdUnknown) {
          const { finalN, steps } = iterateTwoMeans(
            confidenceLevel,
            power,
            sd,
            delta,
          );
          n = finalN;
          setIterSteps(steps);
          desc = `CL=${confidenceLevel}%, Power=${power}%, M1=${m1}, M2=${m2}, SD=${sd} (t-iteration)`;
        } else {
          n = calcCompareTwoMeans(confidenceLevel, power, m1, m2, sd);
          setIterSteps([]);
          desc = `CL=${confidenceLevel}%, Power=${power}%, M1=${m1}, M2=${m2}, SD=${sd}`;
        }
        st = SubType.compareTwoMeans;
      }
      setResult(n);
      save.mutate({
        studyType: StudyType.analytic,
        subType: st,
        inputDescription: desc,
        resultN: n,
      });
    } finally {
      setLoading(false);
    }
  }

  const za = getZAlpha(confidenceLevel).toFixed(3);
  const zb = getZBeta(power).toFixed(3);
  const components =
    result !== null
      ? [
          sub === "means" && sdUnknown
            ? { label: "Method", value: "t-distribution (iteration)" }
            : { label: "z(α/2)", value: za },
          { label: "z(β)", value: zb },
          { label: "Power", value: `${power}%` },
          { label: "n/group", value: String(result) },
        ]
      : [];

  const formulas: Record<Sub, string> = {
    cohort: "n = [zα√(2p̄(1-p̄)) + zβ√(p1(1-p1)+p2(1-p2))]² / (p1-p2)²",
    casecontrol: "p_case = OR×p_ctrl / (1+(OR-1)×p_ctrl); then cohort formula",
    means:
      sub === "means" && sdUnknown
        ? "n₀ = 2(z_α+z_β)²s²/δ²  →  nᵢ = 2(t_α+t_β)²s²/δ²  (iterate until convergence, df=2n-2)"
        : "n = 2(zα+zβ)² × SD² / (μ1-μ2)²",
  };
  const methodologies: Record<Sub, string> = {
    cohort:
      "Fleiss (1981) formula for comparing two independent proportions in a cohort design. Adjust the controls-to-cases ratio for unequal group sizes.",
    casecontrol:
      "Kelsey et al. (1996) case-control formula. The exposure proportion among cases is derived from the odds ratio and the exposure proportion among controls.",
    means:
      sub === "means" && sdUnknown
        ? "Population SD is unknown; uses an iterative t-distribution approach for two independent samples. Start with z-based estimate n₀, then replace z with t(α/2, 2n-2) and t(β, 2n-2) and recompute until convergence. Requires s (estimated pooled SD) and the difference in means (δ = μ₁-μ₂)."
        : "Standard two-sample t-test power formula. Pooled SD is used as the common standard deviation estimate. Assumes equal group variances.",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <Tabs
          value={sub}
          onValueChange={(v) => {
            setSub(v as Sub);
            setResult(null);
            setIterSteps([]);
            setSdUnknown(false);
          }}
        >
          <TabsList className="mb-4 w-full grid grid-cols-3">
            <TabsTrigger
              value="cohort"
              data-ocid="analytic.cohort.tab"
              className="text-xs text-white data-[state=inactive]:text-white"
            >
              Cohort
            </TabsTrigger>
            <TabsTrigger
              value="casecontrol"
              data-ocid="analytic.casecontrol.tab"
              className="text-xs text-white data-[state=inactive]:text-white"
            >
              Case-Control
            </TabsTrigger>
            <TabsTrigger
              value="means"
              data-ocid="analytic.means.tab"
              className="text-xs text-white data-[state=inactive]:text-white"
            >
              Two Means
            </TabsTrigger>
          </TabsList>

          {/* Shared fields */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Confidence Level
              </Label>
              <Select
                value={confidenceLevel}
                onValueChange={setConfidenceLevel}
              >
                <SelectTrigger
                  data-ocid="analytic.confidence.select"
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
                Power
              </Label>
              <Select value={power} onValueChange={setPower}>
                <SelectTrigger
                  data-ocid="analytic.power.select"
                  className="mt-1"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="80">80%</SelectItem>
                  <SelectItem value="90">90%</SelectItem>
                  <SelectItem value="95">95%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="cohort" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold text-foreground">
                  P1 (Unexposed)
                </Label>
                <Input
                  data-ocid="analytic.p1.input"
                  type="number"
                  min="0.01"
                  max="0.99"
                  step="0.01"
                  placeholder="0.3"
                  value={p1}
                  onChange={(e) => setP1(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-foreground">
                  P2 (Exposed)
                </Label>
                <Input
                  data-ocid="analytic.p2.input"
                  type="number"
                  min="0.01"
                  max="0.99"
                  step="0.01"
                  placeholder="0.5"
                  value={p2}
                  onChange={(e) => setP2(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Controls : Cases Ratio
              </Label>
              <Input
                data-ocid="analytic.ratio.input"
                type="number"
                min="1"
                step="0.5"
                placeholder="1"
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
                className="mt-1"
              />
            </div>
          </TabsContent>

          <TabsContent value="casecontrol" className="space-y-3">
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Proportion Exposed Among Controls
              </Label>
              <Input
                data-ocid="analytic.pcontrol.input"
                type="number"
                min="0.01"
                max="0.99"
                step="0.01"
                placeholder="0.2"
                value={pControl}
                onChange={(e) => setPControl(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Odds Ratio (OR)
              </Label>
              <Input
                data-ocid="analytic.or.input"
                type="number"
                min="0.1"
                step="0.1"
                placeholder="2.0"
                value={orVal}
                onChange={(e) => setOrVal(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Controls : Cases Ratio
              </Label>
              <Input
                data-ocid="analytic.ratio_cc.input"
                type="number"
                min="1"
                step="0.5"
                placeholder="1"
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
                className="mt-1"
              />
            </div>
          </TabsContent>

          <TabsContent value="means" className="space-y-3">
            {/* SD known / unknown toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
              <button
                type="button"
                role="switch"
                aria-checked={sdUnknown}
                data-ocid="analytic.sd_unknown.toggle"
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold text-foreground">
                  Mean 1
                </Label>
                <Input
                  data-ocid="analytic.mean1.input"
                  type="number"
                  step="0.1"
                  placeholder="50"
                  value={mean1}
                  onChange={(e) => setMean1(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-foreground">
                  Mean 2
                </Label>
                <Input
                  data-ocid="analytic.mean2.input"
                  type="number"
                  step="0.1"
                  placeholder="55"
                  value={mean2}
                  onChange={(e) => setMean2(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                {sdUnknown ? "Estimated Pooled SD (s)" : "Pooled SD (σ)"}
              </Label>
              <Input
                data-ocid="analytic.sd.input"
                type="number"
                min="0"
                step="0.1"
                placeholder="10"
                value={pooledSD}
                onChange={(e) => setPooledSD(e.target.value)}
                className="mt-1"
              />
            </div>
          </TabsContent>
        </Tabs>

        <Button
          type="button"
          data-ocid="analytic.calculate.button"
          onClick={handleCalculate}
          className="w-full mt-4 bg-primary hover:bg-primary/90 text-black font-semibold"
          disabled={loading}
        >
          Calculate Sample Size
        </Button>
      </div>

      <div className="space-y-4">
        <ResultsPanel
          resultN={result}
          perGroup={true}
          formula={formulas[sub]}
          methodology={methodologies[sub]}
          components={components}
          isLoading={loading}
        />

        {/* Iteration table for Two Means with unknown SD */}
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
                      df (2n-2)
                    </th>
                    <th className="text-left py-1 px-2 font-semibold text-foreground">
                      t(α/2, df)
                    </th>
                    <th className="text-left py-1 px-2 font-semibold text-foreground">
                      n/group
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
              Final converged sample size per group highlighted. z-seed: n₀ ={" "}
              {(() => {
                const z_a = getZAlpha(confidenceLevel);
                const z_b = getZBeta(power);
                const m1v = Number.parseFloat(mean1);
                const m2v = Number.parseFloat(mean2);
                const sdv = Number.parseFloat(pooledSD);
                const delta = Math.abs(m1v - m2v);
                if (
                  !Number.isNaN(m1v) &&
                  !Number.isNaN(m2v) &&
                  !Number.isNaN(sdv) &&
                  delta > 0
                )
                  return Math.ceil(
                    (2 * (z_a + z_b) ** 2 * sdv * sdv) / (delta * delta),
                  );
                return "?";
              })()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
