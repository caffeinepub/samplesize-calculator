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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudyType, SubType, useSaveCalculation } from "@/hooks/useQueries";
import {
  calcClusterRctContinuous,
  calcClusterRctProportion,
  clusterDeff,
  getZAlpha,
  getZBeta,
} from "@/utils/sampleSizeFormulas";
import { InfoIcon } from "lucide-react";
import { useState } from "react";
import { ResultsPanel } from "../ResultsPanel";

type Tab = "continuous" | "binary";

interface ClusterResult {
  nPerArm: number;
  clustersPerArm: number;
  deff: number;
}

interface SensitivityRow {
  icc: number;
  deff: number;
  clustersPerArm: number;
  isSelected: boolean;
}

const ICC_RANGE = [0.01, 0.02, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3];

export function ClusterRctCalculator() {
  const [tab, setTab] = useState<Tab>("continuous");
  const [confidenceLevel, setConfidenceLevel] = useState("95");
  const [power, setPower] = useState("80");

  // Continuous inputs
  const [mean1, setMean1] = useState("");
  const [mean2, setMean2] = useState("");
  const [sd, setSd] = useState("");
  const [rhoC, setRhoC] = useState("");
  const [mC, setMC] = useState("");

  // Binary inputs
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [rhoB, setRhoB] = useState("");
  const [mB, setMB] = useState("");

  const [result, setResult] = useState<ClusterResult | null>(null);
  const [loading, setLoading] = useState(false);
  const save = useSaveCalculation();

  function handleCalculate() {
    setLoading(true);
    try {
      if (tab === "continuous") {
        const m1 = Number.parseFloat(mean1);
        const m2 = Number.parseFloat(mean2);
        const sdv = Number.parseFloat(sd);
        const rho = Number.parseFloat(rhoC);
        const m = Number.parseFloat(mC);
        if ([m1, m2, sdv, rho, m].some(Number.isNaN)) return;
        const { nPerArm, clustersPerArm } = calcClusterRctContinuous(
          confidenceLevel,
          power,
          m1,
          m2,
          sdv,
          rho,
          m,
        );
        const deff = clusterDeff(m, rho);
        setResult({ nPerArm, clustersPerArm, deff });
        save.mutate({
          studyType: StudyType.clinicalTrial,
          subType: SubType.parallelRct,
          inputDescription: `Cluster RCT (continuous): CL=${confidenceLevel}%, Power=${power}%, M1=${m1}, M2=${m2}, SD=${sdv}, ICC=${rho}, m=${m}`,
          resultN: clustersPerArm,
        });
      } else {
        const p1v = Number.parseFloat(p1);
        const p2v = Number.parseFloat(p2);
        const rho = Number.parseFloat(rhoB);
        const m = Number.parseFloat(mB);
        if ([p1v, p2v, rho, m].some(Number.isNaN)) return;
        const { nPerArm, clustersPerArm } = calcClusterRctProportion(
          confidenceLevel,
          power,
          p1v,
          p2v,
          rho,
          m,
        );
        const deff = clusterDeff(m, rho);
        setResult({ nPerArm, clustersPerArm, deff });
        save.mutate({
          studyType: StudyType.clinicalTrial,
          subType: SubType.parallelRct,
          inputDescription: `Cluster RCT (binary): CL=${confidenceLevel}%, Power=${power}%, P1=${p1v}, P2=${p2v}, ICC=${rho}, m=${m}`,
          resultN: clustersPerArm,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  const za = getZAlpha(confidenceLevel).toFixed(3);
  const zb = getZBeta(power).toFixed(3);

  const components = result
    ? [
        { label: "z(α/2)", value: za },
        { label: "z(β)", value: zb },
        { label: "DEFF", value: result.deff.toFixed(3) },
        {
          label: "n/arm (individuals)",
          value: result.nPerArm.toLocaleString(),
        },
        {
          label: "Clusters/arm",
          value: result.clustersPerArm.toLocaleString(),
        },
      ]
    : [];

  const formula =
    "DEFF = 1+(m-1)ρ  |  n* = n_simple × DEFF  |  clusters = ⌈n*/m⌉  per arm";

  const methodologies: Record<Tab, string> = {
    continuous:
      "Cluster randomised trial with continuous outcome. The design effect (DEFF) inflates the required individual-level sample size to account for within-cluster correlation (ICC, ρ). n_simple is the standard two-sample t-test sample size. n per arm = n_simple × DEFF. Clusters per arm = ⌈n per arm / m⌉.",
    binary:
      "Cluster randomised trial with binary outcome. DEFF = 1+(m-1)ρ inflates the two-proportion z-test sample size. Clusters per arm = ⌈n per arm / m⌉.",
  };

  // Build sensitivity table rows when a result is available
  const sensitivityRows: SensitivityRow[] = result
    ? (() => {
        const userRho =
          tab === "continuous"
            ? Number.parseFloat(rhoC)
            : Number.parseFloat(rhoB);
        const userM =
          tab === "continuous" ? Number.parseFloat(mC) : Number.parseFloat(mB);
        // Find the ICC in the range closest to userRho
        let closestIdx = 0;
        let minDist = Number.POSITIVE_INFINITY;
        ICC_RANGE.forEach((icc, i) => {
          const d = Math.abs(icc - userRho);
          if (d < minDist) {
            minDist = d;
            closestIdx = i;
          }
        });

        return ICC_RANGE.map((icc, i) => {
          let clustersPerArm: number;
          const deff = clusterDeff(userM, icc);
          if (tab === "continuous") {
            const m1 = Number.parseFloat(mean1);
            const m2 = Number.parseFloat(mean2);
            const sdv = Number.parseFloat(sd);
            ({ clustersPerArm } = calcClusterRctContinuous(
              confidenceLevel,
              power,
              m1,
              m2,
              sdv,
              icc,
              userM,
            ));
          } else {
            const p1v = Number.parseFloat(p1);
            const p2v = Number.parseFloat(p2);
            ({ clustersPerArm } = calcClusterRctProportion(
              confidenceLevel,
              power,
              p1v,
              p2v,
              icc,
              userM,
            ));
          }
          return {
            icc,
            deff,
            clustersPerArm,
            isSelected: i === closestIdx,
          };
        });
      })()
    : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {/* ICC info note */}
          <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
            <InfoIcon className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
            <p className="text-xs leading-relaxed">
              <span className="font-semibold">ICC (ρ):</span> proportion of
              total variance explained by between-cluster differences. Typical
              values: 0.01–0.10 for community trials.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-semibold">Confidence Level</Label>
              <Select
                value={confidenceLevel}
                onValueChange={setConfidenceLevel}
              >
                <SelectTrigger
                  data-ocid="cluster.confidence.select"
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
                  data-ocid="cluster.power.select"
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

          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as Tab);
              setResult(null);
            }}
          >
            <TabsList className="mb-4 w-full grid grid-cols-2">
              <TabsTrigger
                value="continuous"
                data-ocid="cluster.continuous.tab"
              >
                Continuous
              </TabsTrigger>
              <TabsTrigger value="binary" data-ocid="cluster.binary.tab">
                Binary
              </TabsTrigger>
            </TabsList>

            <TabsContent value="continuous" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold">
                    Mean (Control)
                  </Label>
                  <Input
                    data-ocid="cluster.mean1.input"
                    type="number"
                    step="0.1"
                    placeholder="50"
                    value={mean1}
                    onChange={(e) => setMean1(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    Mean (Treatment)
                  </Label>
                  <Input
                    data-ocid="cluster.mean2.input"
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
                <Label className="text-sm font-semibold">
                  Standard Deviation (SD)
                </Label>
                <Input
                  data-ocid="cluster.sd.input"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="10"
                  value={sd}
                  onChange={(e) => setSd(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold">ICC / ρ</Label>
                  <Input
                    data-ocid="cluster.rho.input"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.05"
                    value={rhoC}
                    onChange={(e) => setRhoC(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    Cluster Size (m)
                  </Label>
                  <Input
                    data-ocid="cluster.size.input"
                    type="number"
                    step="1"
                    min="2"
                    placeholder="20"
                    value={mC}
                    onChange={(e) => setMC(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="binary" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold">
                    Proportion (Control)
                  </Label>
                  <Input
                    data-ocid="cluster.p1.input"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.3"
                    value={p1}
                    onChange={(e) => setP1(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    Proportion (Treatment)
                  </Label>
                  <Input
                    data-ocid="cluster.p2.input"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.5"
                    value={p2}
                    onChange={(e) => setP2(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold">ICC / ρ</Label>
                  <Input
                    data-ocid="cluster.rho_b.input"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.05"
                    value={rhoB}
                    onChange={(e) => setRhoB(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    Cluster Size (m)
                  </Label>
                  <Input
                    data-ocid="cluster.size_b.input"
                    type="number"
                    step="1"
                    min="2"
                    placeholder="20"
                    value={mB}
                    onChange={(e) => setMB(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            type="button"
            data-ocid="cluster.calculate.button"
            onClick={handleCalculate}
            className="w-full mt-4 bg-primary hover:bg-primary/90 text-black font-semibold"
            disabled={loading}
          >
            Calculate Sample Size
          </Button>
        </div>

        <ResultsPanel
          resultN={result ? result.clustersPerArm : null}
          perGroup={true}
          formula={formula}
          methodology={methodologies[tab]}
          components={components}
          isLoading={loading}
          perGroupLabel="clusters per arm"
        />
      </div>

      {/* Sensitivity Analysis Table */}
      {result && sensitivityRows.length > 0 && (
        <div
          data-ocid="cluster.sensitivity.table"
          className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-border bg-muted/30">
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              Sensitivity Analysis: Clusters per Arm vs ICC
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              All other inputs held constant. Highlighted row is closest to your
              entered ICC value.
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-1/3">
                  ICC (ρ)
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-1/3">
                  DEFF
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-1/3">
                  Clusters / Arm
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sensitivityRows.map((row) => (
                <TableRow
                  key={row.icc}
                  className={
                    row.isSelected
                      ? "bg-primary/10 font-semibold hover:bg-primary/15"
                      : "hover:bg-muted/30"
                  }
                >
                  <TableCell className="text-sm">
                    <span
                      className={row.isSelected ? "font-bold text-primary" : ""}
                    >
                      {row.icc.toFixed(2)}
                    </span>
                    {row.isSelected && (
                      <span className="ml-2 text-xs font-normal text-primary/80 bg-primary/15 px-1.5 py-0.5 rounded-full">
                        selected
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={`text-sm ${row.isSelected ? "font-bold text-primary" : "text-muted-foreground"}`}
                  >
                    {row.deff.toFixed(3)}
                  </TableCell>
                  <TableCell
                    className={`text-sm ${row.isSelected ? "font-bold text-primary" : ""}`}
                  >
                    {row.clustersPerArm.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
