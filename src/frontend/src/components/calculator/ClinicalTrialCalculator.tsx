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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudyType, SubType, useSaveCalculation } from "@/hooks/useQueries";
import {
  calcCrossover,
  calcCrossoverProportion,
  calcNonInferiority,
  calcNonInferiorityProportion,
  calcOneSampleMean,
  calcOneSampleProportion,
  calcParallelRctContinuous,
  calcParallelRctProportion,
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

  // Superiority RCT
  const [isContinuous, setIsContinuous] = useState(true);
  const [val1, setVal1] = useState("");
  const [val2, setVal2] = useState("");
  const [sd, setSd] = useState("");

  // Non-Inferiority
  const [niIsContinuous, setNiIsContinuous] = useState(true);
  const [niVal1, setNiVal1] = useState("");
  const [niVal2, setNiVal2] = useState("");
  const [niSd, setNiSd] = useState("");
  const [delta, setDelta] = useState("");

  // Crossover
  const [coIsContinuous, setCoIsContinuous] = useState(true);
  const [meanDiff, setMeanDiff] = useState("");
  const [withinSD, setWithinSD] = useState("");
  const [coP1, setCoP1] = useState("");
  const [coP2, setCoP2] = useState("");

  // One-sample
  const [osIsContinuous, setOsIsContinuous] = useState(true);
  const [osP0, setOsP0] = useState("");
  const [osP1, setOsP1] = useState("");
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
        if (Number.isNaN(v1) || Number.isNaN(v2)) return;
        if (isContinuous) {
          const sdv = Number.parseFloat(sd);
          if (Number.isNaN(sdv)) return;
          n = calcParallelRctContinuous(confidenceLevel, power, v1, v2, sdv);
          desc = `Superiority RCT (continuous): CL=${confidenceLevel}%, Power=${power}%, M1=${v1}, M2=${v2}, SD=${sdv}`;
        } else {
          n = calcParallelRctProportion(confidenceLevel, power, v1, v2);
          desc = `Superiority RCT (proportion): CL=${confidenceLevel}%, Power=${power}%, P1=${v1}, P2=${v2}`;
        }
        st = SubType.parallelRct;
      } else if (sub === "noninferiority") {
        const v1 = Number.parseFloat(niVal1);
        const v2 = Number.parseFloat(niVal2);
        const dv = Number.parseFloat(delta);
        if (Number.isNaN(v1) || Number.isNaN(v2) || Number.isNaN(dv)) return;
        if (niIsContinuous) {
          const sdv = Number.parseFloat(niSd);
          if (Number.isNaN(sdv)) return;
          n = calcNonInferiority(confidenceLevel, power, v1, v2, sdv, dv);
          desc = `Non-inferiority (continuous): CL=${confidenceLevel}%, Power=${power}%, delta=${dv}`;
        } else {
          n = calcNonInferiorityProportion(confidenceLevel, power, v1, v2, dv);
          desc = `Non-inferiority (proportion): CL=${confidenceLevel}%, Power=${power}%, P1=${v1}, P2=${v2}, delta=${dv}`;
        }
        st = SubType.nonInferiorityTrial;
      } else if (sub === "crossover") {
        if (coIsContinuous) {
          const md = Number.parseFloat(meanDiff);
          const ws = Number.parseFloat(withinSD);
          if (Number.isNaN(md) || Number.isNaN(ws)) return;
          n = calcCrossover(confidenceLevel, power, md, ws);
          desc = `Crossover (continuous): CL=${confidenceLevel}%, Power=${power}%, diff=${md}, withinSD=${ws}`;
        } else {
          const p1 = Number.parseFloat(coP1);
          const p2 = Number.parseFloat(coP2);
          if (Number.isNaN(p1) || Number.isNaN(p2)) return;
          n = calcCrossoverProportion(confidenceLevel, power, p1, p2);
          desc = `Crossover (proportion): CL=${confidenceLevel}%, Power=${power}%, P1=${p1}, P2=${p2}`;
        }
        st = SubType.crossoverTrial;
      } else if (sub === "onesample") {
        if (osIsContinuous) {
          const mu0 = Number.parseFloat(osMu0);
          const mu1 = Number.parseFloat(osMu1);
          const sigma = Number.parseFloat(osSigma);
          if (Number.isNaN(mu0) || Number.isNaN(mu1) || Number.isNaN(sigma))
            return;
          n = calcOneSampleMean(confidenceLevel, power, mu0, mu1, sigma);
          desc = `One-Sample (continuous): CL=${confidenceLevel}%, Power=${power}%, μ₀=${mu0}, μ₁=${mu1}, σ=${sigma}`;
        } else {
          const p0 = Number.parseFloat(osP0);
          const p1 = Number.parseFloat(osP1);
          if (Number.isNaN(p0) || Number.isNaN(p1)) return;
          n = calcOneSampleProportion(confidenceLevel, power, p0, p1);
          desc = `One-Sample (proportion): CL=${confidenceLevel}%, Power=${power}%, p₀=${p0}, p₁=${p1}`;
        }
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
    parallel: isContinuous
      ? "n = 2(zα/2 + zβ)² × SD² / (μ₁ - μ₂)²  per arm"
      : "n = [zα/2·√(2p̅(1-p̅)) + zβ·√(p₁(1-p₁)+p₂(1-p₂))]² / (p₁-p₂)²  per arm",
    noninferiority: niIsContinuous
      ? "n = 2(zα + zβ)² × SD² / (δ - |μ₁ - μ₂|)²  per arm  (one-sided α)"
      : "n = [zα·√(2p̄(1-p̄)) + zβ·√(p₁(1-p₁)+p₂(1-p₂))]² / (δ - |p₁-p₂|)²  per arm",
    crossover: coIsContinuous
      ? "n = 2(zα/2 + zβ)² × σ_w² / Δ²  per sequence"
      : "n = 2(zα/2 + zβ)² × p̄(1-p̄) / Δ²  per sequence  (Δ = |p₁-p₂|)",
    onesample: osIsContinuous
      ? "n = (zα/2 + zβ)² × σ² / (μ₁ - μ₀)²"
      : "n = [zα/2·√(p₀(1-p₀)) + zβ·√(p₁(1-p₁))]² / (p₁ - p₀)²",
  };
  const methodologies: Record<Sub, string> = {
    parallel:
      "Two-arm parallel superiority RCT (two-sided test). Tests whether treatment differs from control. Formula uses zα/2 (two-sided critical value: 1.96 for 95% confidence). Continuous outcome uses the pooled-variance z-test power formula; binary outcome uses the two-proportion z-test. n is per arm.",
    noninferiority: niIsContinuous
      ? "Non-inferiority design (continuous outcome): tests that the experimental treatment is not worse than control by more than margin δ (one-sided test). zα uses one-sided alpha convention. n is per arm."
      : "Non-inferiority design (binary outcome): tests that the event rate of the experimental treatment is not worse than control by more than margin δ (in proportion units). Uses the two-proportion z-test with NI margin adjustment. n is per arm.",
    crossover: coIsContinuous
      ? "Two-period crossover design (continuous outcome). Uses within-subject standard deviation (σ_w), typically smaller than between-subject SD, leading to more efficient designs. Formula uses zα/2 (two-sided). n is per sequence arm."
      : "Two-period crossover design (binary outcome). Uses the paired-proportion approach: n depends on the pooled proportion p̄ and the expected difference Δ = |p₁-p₂|. Smaller differences require larger samples. n is per sequence.",
    onesample:
      "One-sample test: compares a single group against a known or hypothesised reference value (μ₀ or p₀). Continuous outcome: z-test for a single mean using H₀: μ = μ₀. Binary outcome: z-test for a single proportion using H₀: p = p₀. Both use a two-sided test. The total required sample size (n) is for the single group.",
  };

  const outcomeToggle = (
    isCont: boolean,
    setIsCont: (v: boolean) => void,
    switchId: string,
  ) => (
    <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
      <Label className="text-sm font-medium">Outcome Type:</Label>
      <span
        className={`text-sm ${
          !isCont ? "text-primary font-semibold" : "text-muted-foreground"
        }`}
      >
        Binary
      </span>
      <Switch
        data-ocid={switchId}
        checked={isCont}
        onCheckedChange={setIsCont}
      />
      <span
        className={`text-sm ${
          isCont ? "text-primary font-semibold" : "text-muted-foreground"
        }`}
      >
        Continuous
      </span>
    </div>
  );

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
              Superiority RCT
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

          {/* ── Superiority RCT ── */}
          <TabsContent value="parallel" className="space-y-3">
            {outcomeToggle(
              isContinuous,
              setIsContinuous,
              "clinical.outcome_type.switch",
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold text-foreground">
                  {isContinuous ? "Mean (Control)" : "Proportion (Control)"}
                </Label>
                <Input
                  data-ocid="clinical.val1.input"
                  type="number"
                  step="0.01"
                  placeholder={isContinuous ? "50" : "0.3"}
                  value={val1}
                  onChange={(e) => setVal1(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-foreground">
                  {isContinuous ? "Mean (Treatment)" : "Proportion (Treatment)"}
                </Label>
                <Input
                  data-ocid="clinical.val2.input"
                  type="number"
                  step="0.01"
                  placeholder={isContinuous ? "55" : "0.5"}
                  value={val2}
                  onChange={(e) => setVal2(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            {isContinuous && (
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
            )}
          </TabsContent>

          {/* ── Non-Inferiority ── */}
          <TabsContent value="noninferiority" className="space-y-3">
            {outcomeToggle(
              niIsContinuous,
              setNiIsContinuous,
              "clinical.ni_outcome_type.switch",
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold text-foreground">
                  {niIsContinuous ? "Mean (Control)" : "Proportion (Control)"}
                </Label>
                <Input
                  data-ocid="clinical.ni_val1.input"
                  type="number"
                  step="0.01"
                  placeholder={niIsContinuous ? "50" : "0.3"}
                  value={niVal1}
                  onChange={(e) => setNiVal1(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-foreground">
                  {niIsContinuous
                    ? "Mean (Treatment)"
                    : "Proportion (Treatment)"}
                </Label>
                <Input
                  data-ocid="clinical.ni_val2.input"
                  type="number"
                  step="0.01"
                  placeholder={niIsContinuous ? "48" : "0.35"}
                  value={niVal2}
                  onChange={(e) => setNiVal2(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            {niIsContinuous && (
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
            )}
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Non-Inferiority Margin (δ)
              </Label>
              <p className="text-xs text-muted-foreground mb-1">
                {niIsContinuous
                  ? "Maximum acceptable difference (same units as mean)"
                  : "Maximum acceptable difference in proportions (e.g. 0.10)"}
              </p>
              <Input
                data-ocid="clinical.delta.input"
                type="number"
                min="0"
                step={niIsContinuous ? "0.1" : "0.01"}
                placeholder={niIsContinuous ? "5" : "0.10"}
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                className="mt-1"
              />
            </div>
          </TabsContent>

          {/* ── Crossover ── */}
          <TabsContent value="crossover" className="space-y-3">
            {outcomeToggle(
              coIsContinuous,
              setCoIsContinuous,
              "clinical.co_outcome_type.switch",
            )}
            {coIsContinuous ? (
              <>
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
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-semibold text-foreground">
                      Proportion (Period 1 / Control)
                    </Label>
                    <Input
                      data-ocid="clinical.co_p1.input"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      placeholder="0.40"
                      value={coP1}
                      onChange={(e) => setCoP1(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-foreground">
                      Proportion (Period 2 / Treatment)
                    </Label>
                    <Input
                      data-ocid="clinical.co_p2.input"
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      placeholder="0.60"
                      value={coP2}
                      onChange={(e) => setCoP2(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter expected event proportions in each period. The design
                  uses the pooled proportion and the difference Δ = |p₁ - p₂|.
                </p>
              </>
            )}
          </TabsContent>

          {/* ── One-Sample ── */}
          <TabsContent value="onesample" className="space-y-3">
            {outcomeToggle(
              osIsContinuous,
              setOsIsContinuous,
              "clinical.os_outcome_type.switch",
            )}

            {osIsContinuous ? (
              <>
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
              </>
            ) : (
              <>
                <div>
                  <Label className="text-sm font-semibold text-foreground">
                    Null Hypothesis Proportion (p₀)
                  </Label>
                  <p className="text-xs text-muted-foreground mb-1">
                    Reference proportion (e.g. 0.30)
                  </p>
                  <Input
                    data-ocid="clinical.os_p0.input"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    placeholder="0.30"
                    value={osP0}
                    onChange={(e) => setOsP0(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground">
                    Alternative Proportion (p₁)
                  </Label>
                  <p className="text-xs text-muted-foreground mb-1">
                    Expected proportion under alternative hypothesis
                  </p>
                  <Input
                    data-ocid="clinical.os_p1.input"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    placeholder="0.50"
                    value={osP1}
                    onChange={(e) => setOsP1(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </>
            )}
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
