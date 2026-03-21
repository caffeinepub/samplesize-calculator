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
      } else {
        const m1 = Number.parseFloat(mean1);
        const m2 = Number.parseFloat(mean2);
        const sd = Number.parseFloat(pooledSD);
        if (Number.isNaN(m1) || Number.isNaN(m2) || Number.isNaN(sd)) return;
        n = calcCompareTwoMeans(confidenceLevel, power, m1, m2, sd);
        desc = `CL=${confidenceLevel}%, Power=${power}%, M1=${m1}, M2=${m2}, SD=${sd}`;
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
          { label: "z(α/2)", value: za },
          { label: "z(β)", value: zb },
          { label: "Power", value: `${power}%` },
          { label: "n/group", value: String(result) },
        ]
      : [];

  const formulas: Record<Sub, string> = {
    cohort: "n = [zα√(2p̄(1-p̄)) + zβ√(p1(1-p1)+p2(1-p2))]² / (p1-p2)²",
    casecontrol: "p_case = OR×p_ctrl / (1+(OR-1)×p_ctrl); then cohort formula",
    means: "n = 2(zα+zβ)² × SD² / (μ1-μ2)²",
  };
  const methodologies: Record<Sub, string> = {
    cohort:
      "Fleiss (1981) formula for comparing two independent proportions in a cohort design. Adjust the controls-to-cases ratio for unequal group sizes.",
    casecontrol:
      "Kelsey et al. (1996) case-control formula. The exposure proportion among cases is derived from the odds ratio and the exposure proportion among controls.",
    means:
      "Standard two-sample t-test power formula. Pooled SD is used as the common standard deviation estimate. Assumes equal group variances.",
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
                Pooled SD
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

      <ResultsPanel
        resultN={result}
        perGroup={true}
        formula={formulas[sub]}
        methodology={methodologies[sub]}
        components={components}
        isLoading={loading}
      />
    </div>
  );
}
