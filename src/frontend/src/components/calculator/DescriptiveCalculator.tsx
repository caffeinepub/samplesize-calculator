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
  calcEstimateMean,
  calcEstimateProportion,
  getZAlpha,
} from "@/utils/sampleSizeFormulas";
import { useState } from "react";
import { ResultsPanel } from "../ResultsPanel";

export function DescriptiveCalculator() {
  const [subType, setSubType] = useState<"proportion" | "mean">("proportion");
  const [confidenceLevel, setConfidenceLevel] = useState("95");
  const [p, setP] = useState("");
  const [d, setD] = useState("");
  const [sigma, setSigma] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const save = useSaveCalculation();

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
        desc = `CL=${confidenceLevel}%, p=${pv}, d=${dv}`;
        st = SubType.estimateProportion;
      } else {
        const sv = Number.parseFloat(sigma);
        const dv = Number.parseFloat(d);
        if (Number.isNaN(sv) || Number.isNaN(dv) || sv <= 0 || dv <= 0) return;
        n = calcEstimateMean(confidenceLevel, sv, dv);
        desc = `CL=${confidenceLevel}%, σ=${sv}, d=${dv}`;
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
          { label: "z(α/2)", value: za },
          subType === "proportion"
            ? { label: "p", value: p }
            : { label: "σ", value: sigma },
          { label: "d (margin)", value: d },
          { label: "n", value: String(result) },
        ]
      : [];

  const formula =
    subType === "proportion" ? "n = z² × p × (1-p) / d²" : "n = z² × σ² / d²";
  const methodology =
    subType === "proportion"
      ? "Uses the Cochran (1977) formula for estimating a single proportion. Assumes a simple random sample with normal approximation. Requires p (expected proportion) and d (acceptable margin of error)."
      : "Uses the formula for estimating a population mean. Requires σ (population/pilot standard deviation) and d (margin of error). Normal approximation is assumed.";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <Tabs
          value={subType}
          onValueChange={(v) => {
            setSubType(v as "proportion" | "mean");
            setResult(null);
          }}
        >
          <TabsList className="mb-4 w-full">
            <TabsTrigger
              value="proportion"
              data-ocid="descriptive.proportion.tab"
              className="flex-1"
            >
              Estimate a Proportion
            </TabsTrigger>
            <TabsTrigger
              value="mean"
              data-ocid="descriptive.mean.tab"
              className="flex-1"
            >
              Estimate a Mean
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proportion" className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Confidence Level</Label>
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
              <Label className="text-sm font-semibold">
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
              <Label className="text-sm font-semibold">
                Margin of Error (d)
              </Label>
              <p className="text-xs text-muted-foreground mb-1">
                Acceptable margin as proportion (e.g. 0.05 = ±5%)
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
          </TabsContent>

          <TabsContent value="mean" className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Confidence Level</Label>
              <Select
                value={confidenceLevel}
                onValueChange={setConfidenceLevel}
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
            <div>
              <Label className="text-sm font-semibold">
                Expected Standard Deviation (σ)
              </Label>
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
              <Label className="text-sm font-semibold">
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
          </TabsContent>
        </Tabs>

        <Button
          type="button"
          data-ocid="descriptive.calculate.button"
          onClick={handleCalculate}
          className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          disabled={loading}
        >
          Calculate Sample Size
        </Button>
      </div>

      <ResultsPanel
        resultN={result}
        perGroup={false}
        formula={formula}
        methodology={methodology}
        components={components}
        isLoading={loading}
      />
    </div>
  );
}
