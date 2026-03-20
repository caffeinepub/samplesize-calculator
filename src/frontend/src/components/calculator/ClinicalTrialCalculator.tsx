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
  calcNonInferiority,
  calcParallelRctContinuous,
  calcParallelRctProportion,
  getZAlpha,
  getZBeta,
} from "@/utils/sampleSizeFormulas";
import { useState } from "react";
import { ResultsPanel } from "../ResultsPanel";

type Sub = "parallel" | "noninferiority" | "crossover";

export function ClinicalTrialCalculator() {
  const [sub, setSub] = useState<Sub>("parallel");
  const [confidenceLevel, setConfidenceLevel] = useState("95");
  const [power, setPower] = useState("80");
  const [isContinuous, setIsContinuous] = useState(true);
  const [val1, setVal1] = useState("");
  const [val2, setVal2] = useState("");
  const [sd, setSd] = useState("");
  const [delta, setDelta] = useState("");
  const [meanDiff, setMeanDiff] = useState("");
  const [withinSD, setWithinSD] = useState("");
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
          desc = `RCT continuous: CL=${confidenceLevel}%, Power=${power}%, M1=${v1}, M2=${v2}, SD=${sdv}`;
        } else {
          n = calcParallelRctProportion(confidenceLevel, power, v1, v2);
          desc = `RCT proportion: CL=${confidenceLevel}%, Power=${power}%, P1=${v1}, P2=${v2}`;
        }
        st = SubType.parallelRct;
      } else if (sub === "noninferiority") {
        const v1 = Number.parseFloat(val1);
        const v2 = Number.parseFloat(val2);
        const sdv = Number.parseFloat(sd);
        const dv = Number.parseFloat(delta);
        if (
          Number.isNaN(v1) ||
          Number.isNaN(v2) ||
          Number.isNaN(sdv) ||
          Number.isNaN(dv)
        )
          return;
        n = calcNonInferiority(confidenceLevel, power, v1, v2, sdv, dv);
        desc = `Non-inferiority: CL=${confidenceLevel}%, Power=${power}%, δ=${dv}`;
        st = SubType.nonInferiorityTrial;
      } else {
        const md = Number.parseFloat(meanDiff);
        const ws = Number.parseFloat(withinSD);
        if (Number.isNaN(md) || Number.isNaN(ws)) return;
        n = calcCrossover(confidenceLevel, power, md, ws);
        desc = `Crossover: CL=${confidenceLevel}%, Power=${power}%, Δ=${md}, withinSD=${ws}`;
        st = SubType.crossoverTrial;
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
          { label: "n/arm", value: String(result) },
        ]
      : [];

  const formulas: Record<Sub, string> = {
    parallel: isContinuous
      ? "n = 2(zα+zβ)²×SD² / (μ1-μ2)² per arm"
      : "n = [zα√(2p̄(1-p̄))+zβ√(p1(1-p1)+p2(1-p2))]² / (p1-p2)² per arm",
    noninferiority: "n = 2(zα+zβ)²×SD² / (δ-|μ1-μ2|)² per arm",
    crossover: "n = 2(zα+zβ)²×σ_w² / Δ² per sequence",
  };
  const methodologies: Record<Sub, string> = {
    parallel:
      "Two-arm parallel group RCT superiority design. Toggle between continuous outcome (t-test power formula) and binary outcome (proportion comparison). Each arm receives n participants.",
    noninferiority:
      "Non-inferiority design: tests whether experimental treatment is not worse than control by more than margin δ. Uses one-sided testing convention with the non-inferiority margin.",
    crossover:
      "Two-period crossover design. Uses within-subject standard deviation (σ_w) which is typically smaller than between-subject SD, leading to more efficient designs.",
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
              value="parallel"
              data-ocid="clinical.parallel.tab"
              className="text-xs"
            >
              Parallel RCT
            </TabsTrigger>
            <TabsTrigger
              value="noninferiority"
              data-ocid="clinical.noninferiority.tab"
              className="text-xs"
            >
              Non-Inferiority
            </TabsTrigger>
            <TabsTrigger
              value="crossover"
              data-ocid="clinical.crossover.tab"
              className="text-xs"
            >
              Crossover
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-semibold">Confidence Level</Label>
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
              <Label className="text-sm font-semibold">Power</Label>
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

          <TabsContent value="parallel" className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
              <Label className="text-sm font-medium">Outcome Type:</Label>
              <span
                className={`text-sm ${
                  !isContinuous
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                Binary
              </span>
              <Switch
                data-ocid="clinical.outcome_type.switch"
                checked={isContinuous}
                onCheckedChange={setIsContinuous}
              />
              <span
                className={`text-sm ${
                  isContinuous
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                Continuous
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold">
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
                <Label className="text-sm font-semibold">
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
                <Label className="text-sm font-semibold">
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

          <TabsContent value="noninferiority" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold">
                  Expected Mean (Control)
                </Label>
                <Input
                  data-ocid="clinical.ni_val1.input"
                  type="number"
                  step="0.1"
                  placeholder="50"
                  value={val1}
                  onChange={(e) => setVal1(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">
                  Expected Mean (Treatment)
                </Label>
                <Input
                  data-ocid="clinical.ni_val2.input"
                  type="number"
                  step="0.1"
                  placeholder="48"
                  value={val2}
                  onChange={(e) => setVal2(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">
                Standard Deviation (SD)
              </Label>
              <Input
                data-ocid="clinical.ni_sd.input"
                type="number"
                min="0"
                step="0.1"
                placeholder="10"
                value={sd}
                onChange={(e) => setSd(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">
                Non-Inferiority Margin (δ)
              </Label>
              <p className="text-xs text-muted-foreground mb-1">
                Maximum acceptable difference
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

          <TabsContent value="crossover" className="space-y-3">
            <div>
              <Label className="text-sm font-semibold">
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
              <Label className="text-sm font-semibold">
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
        </Tabs>

        <Button
          type="button"
          data-ocid="clinical.calculate.button"
          onClick={handleCalculate}
          className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
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
