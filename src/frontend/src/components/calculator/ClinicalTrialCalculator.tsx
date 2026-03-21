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
  calcCrossover,
  calcNonInferiority,
  calcOneSampleMean,
  calcParallelRctContinuous,
  getZAlpha,
  getZBeta,
} from "@/utils/sampleSizeFormulas";
import { useState } from "react";
import { ResultsPanel } from "../ResultsPanel";

type Sub = "parallel" | "noninferiority" | "crossover" | "onesample";

export function ClinicalTrialCalculator() {
  const [sub, setSub] = useState<Sub>("parallel");
  const [confidenceLevel, setConfidenceLevel] = useState("95");
  const [power, setPower] = useState("80");

  // Superiority
  const [val1, setVal1] = useState("");
  const [val2, setVal2] = useState("");
  const [sd, setSd] = useState("");

  // Non-Inferiority
  const [niVal1, setNiVal1] = useState("");
  const [niVal2, setNiVal2] = useState("");
  const [niSd, setNiSd] = useState("");
  const [delta, setDelta] = useState("");

  // Crossover
  const [meanDiff, setMeanDiff] = useState("");
  const [withinSD, setWithinSD] = useState("");

  // One-sample
  const [osMu0, setOsMu0] = useState("");
  const [osMu1, setOsMu1] = useState("");
  const [osSigma, setOsSigma] = useState("");

  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const save = useSaveCalculation();

  function handleCalculate() {
    setLoading(true);
    try {
      let n = 0;
      let desc = "";
      let st = SubType.parallelRct;
      if (sub === "parallel") {
        const v1 = Number.parseFloat(val1);
        const v2 = Number.parseFloat(val2);
        const sdv = Number.parseFloat(sd);
        if (Number.isNaN(v1) || Number.isNaN(v2) || Number.isNaN(sdv)) return;
        n = calcParallelRctContinuous(confidenceLevel, power, v1, v2, sdv);
        desc = `Superiority (continuous): CL=${confidenceLevel}%, Power=${power}%, M1=${v1}, M2=${v2}, SD=${sdv}`;
        st = SubType.parallelRct;
      } else if (sub === "noninferiority") {
        const v1 = Number.parseFloat(niVal1);
        const v2 = Number.parseFloat(niVal2);
        const dv = Number.parseFloat(delta);
        const sdv = Number.parseFloat(niSd);
        if (
          Number.isNaN(v1) ||
          Number.isNaN(v2) ||
          Number.isNaN(dv) ||
          Number.isNaN(sdv)
        )
          return;
        n = calcNonInferiority(confidenceLevel, power, v1, v2, sdv, dv);
        desc = `Non-inferiority (continuous): CL=${confidenceLevel}%, Power=${power}%, delta=${dv}`;
        st = SubType.nonInferiorityTrial;
      } else if (sub === "crossover") {
        const md = Number.parseFloat(meanDiff);
        const ws = Number.parseFloat(withinSD);
        if (Number.isNaN(md) || Number.isNaN(ws)) return;
        n = calcCrossover(confidenceLevel, power, md, ws);
        desc = `Crossover (continuous): CL=${confidenceLevel}%, Power=${power}%, diff=${md}, withinSD=${ws}`;
        st = SubType.crossoverTrial;
      } else if (sub === "onesample") {
        const mu0 = Number.parseFloat(osMu0);
        const mu1 = Number.parseFloat(osMu1);
        const sigma = Number.parseFloat(osSigma);
        if (Number.isNaN(mu0) || Number.isNaN(mu1) || Number.isNaN(sigma))
          return;
        n = calcOneSampleMean(confidenceLevel, power, mu0, mu1, sigma);
        desc = `One-Sample (continuous): CL=${confidenceLevel}%, Power=${power}%, μ₀=${mu0}, μ₁=${mu1}, σ=${sigma}`;
        st = SubType.parallelRct;
      }
      setResult(n);
      save.mutate({
        studyType: StudyType.clinicalTrial,
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
          { label: "z(α/2)", value: za },
          { label: "z(β)", value: zb },
          { label: "Power", value: `${power}%` },
          {
            label: sub === "onesample" ? "n (total)" : "n/arm",
            value: String(result),
          },
        ]
      : [];

  const formulas: Record<Sub, string> = {
    parallel: "n = 2(zα/2 + zβ)² × SD² / (μ₁ - μ₂)²  per arm",
    noninferiority:
      "n = 2(zα + zβ)² × SD² / (δ - |μ₁ - μ₂|)²  per arm  (one-sided α)",
    crossover: "n = 2(zα/2 + zβ)² × σ_w² / Δ²  per sequence",
    onesample: "n = (zα/2 + zβ)² × σ² / (μ₁ - μ₀)²",
  };
  const methodologies: Record<Sub, string> = {
    parallel:
      "Two-arm parallel superiority RCT (two-sided test). Tests whether treatment differs from control. Formula uses zα/2 (two-sided critical value: 1.96 for 95% confidence). Continuous outcome uses the pooled-variance z-test power formula. n is per arm.",
    noninferiority:
      "Non-inferiority design (continuous outcome): tests that the experimental treatment is not worse than control by more than margin δ (one-sided test). zα uses one-sided alpha convention. n is per arm.",
    crossover:
      "Two-period crossover design (continuous outcome). Uses within-subject standard deviation (σ_w), typically smaller than between-subject SD, leading to more efficient designs. Formula uses zα/2 (two-sided). n is per sequence arm.",
    onesample:
      "One-sample test: compares a single group against a known or hypothesised reference mean (μ₀). Continuous outcome: z-test for a single mean using H₀: μ = μ₀. Uses a two-sided test. The total required sample size (n) is for the single group.",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <Tabs
          value={sub}
          onValueChange={(v) => {
            setSub(v as Sub);
            setResult(null);
          }}
        >
          <TabsList className="mb-4 w-full grid grid-cols-4">
            <TabsTrigger
              value="parallel"
              data-ocid="clinical.parallel.tab"
              className="text-xs text-white data-[state=inactive]:text-white"
            >
              Superiority
            </TabsTrigger>
            <TabsTrigger
              value="noninferiority"
              data-ocid="clinical.noninferiority.tab"
              className="text-xs text-white data-[state=inactive]:text-white"
            >
              Non-Inferiority
            </TabsTrigger>
            <TabsTrigger
              value="crossover"
              data-ocid="clinical.crossover.tab"
              className="text-xs text-white data-[state=inactive]:text-white"
            >
              Crossover
            </TabsTrigger>
            <TabsTrigger
              value="onesample"
              data-ocid="clinical.onesample.tab"
              className="text-xs text-white data-[state=inactive]:text-white"
            >
              One-Sample
            </TabsTrigger>
          </TabsList>

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
                  data-ocid="clinical.confidence.select"
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
                  data-ocid="clinical.power.select"
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

          {/* ── Superiority ── */}
          <TabsContent value="parallel" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold text-foreground">
                  Mean (Control)
                </Label>
                <Input
                  data-ocid="clinical.val1.input"
                  type="number"
                  step="0.01"
                  placeholder="50"
                  value={val1}
                  onChange={(e) => setVal1(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-foreground">
                  Mean (Treatment)
                </Label>
                <Input
                  data-ocid="clinical.val2.input"
                  type="number"
                  step="0.01"
                  placeholder="55"
                  value={val2}
                  onChange={(e) => setVal2(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Standard Deviation (SD)
              </Label>
              <Input
                data-ocid="clinical.sd.input"
                type="number"
                min="0"
                step="0.1"
                placeholder="10"
                value={sd}
                onChange={(e) => setSd(e.target.value)}
                className="mt-1"
              />
            </div>
          </TabsContent>

          {/* ── Non-Inferiority ── */}
          <TabsContent value="noninferiority" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold text-foreground">
                  Mean (Control)
                </Label>
                <Input
                  data-ocid="clinical.ni_val1.input"
                  type="number"
                  step="0.01"
                  placeholder="50"
                  value={niVal1}
                  onChange={(e) => setNiVal1(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-foreground">
                  Mean (Treatment)
                </Label>
                <Input
                  data-ocid="clinical.ni_val2.input"
                  type="number"
                  step="0.01"
                  placeholder="48"
                  value={niVal2}
                  onChange={(e) => setNiVal2(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Standard Deviation (SD)
              </Label>
              <Input
                data-ocid="clinical.ni_sd.input"
                type="number"
                min="0"
                step="0.1"
                placeholder="10"
                value={niSd}
                onChange={(e) => setNiSd(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Non-Inferiority Margin (δ)
              </Label>
              <p className="text-xs text-muted-foreground mb-1">
                Maximum acceptable difference (same units as mean)
              </p>
              <Input
                data-ocid="clinical.delta.input"
                type="number"
                min="0"
                step="0.1"
                placeholder="5"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                className="mt-1"
              />
            </div>
          </TabsContent>

          {/* ── Crossover ── */}
          <TabsContent value="crossover" className="space-y-3">
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Expected Mean Difference (Δ)
              </Label>
              <Input
                data-ocid="clinical.meandiff.input"
                type="number"
                step="0.1"
                placeholder="5"
                value={meanDiff}
                onChange={(e) => setMeanDiff(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Within-Subject Standard Deviation (σ_w)
              </Label>
              <Input
                data-ocid="clinical.withinsd.input"
                type="number"
                min="0"
                step="0.1"
                placeholder="8"
                value={withinSD}
                onChange={(e) => setWithinSD(e.target.value)}
                className="mt-1"
              />
            </div>
          </TabsContent>

          {/* ── One-Sample ── */}
          <TabsContent value="onesample" className="space-y-3">
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Null Hypothesis Mean (μ₀)
              </Label>
              <p className="text-xs text-muted-foreground mb-1">
                The reference / hypothesised mean
              </p>
              <Input
                data-ocid="clinical.os_mu0.input"
                type="number"
                step="0.1"
                placeholder="50"
                value={osMu0}
                onChange={(e) => setOsMu0(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Alternative Mean (μ₁)
              </Label>
              <p className="text-xs text-muted-foreground mb-1">
                The clinically meaningful mean to detect
              </p>
              <Input
                data-ocid="clinical.os_mu1.input"
                type="number"
                step="0.1"
                placeholder="55"
                value={osMu1}
                onChange={(e) => setOsMu1(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Standard Deviation (σ)
              </Label>
              <Input
                data-ocid="clinical.os_sigma.input"
                type="number"
                min="0"
                step="0.1"
                placeholder="10"
                value={osSigma}
                onChange={(e) => setOsSigma(e.target.value)}
                className="mt-1"
              />
            </div>
          </TabsContent>
        </Tabs>

        <Button
          type="button"
          data-ocid="clinical.calculate.button"
          onClick={handleCalculate}
          className="w-full mt-4 bg-primary hover:bg-primary/90 text-black font-semibold"
          disabled={loading}
        >
          Calculate Sample Size
        </Button>
      </div>

      <ResultsPanel
        resultN={result}
        perGroup={sub !== "onesample"}
        formula={formulas[sub]}
        methodology={methodologies[sub]}
        components={components}
        isLoading={loading}
      />
    </div>
  );
}
