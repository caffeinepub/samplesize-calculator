import { Skeleton } from "@/components/ui/skeleton";
import { useRecentCalculations } from "@/hooks/useQueries";
import { ChevronRight, Clock } from "lucide-react";

const STUDY_LABELS: Record<string, string> = {
  descriptive: "Descriptive",
  analytic: "Analytic",
  clinicalTrial: "Clinical Trial",
};

const SUB_LABELS: Record<string, string> = {
  estimateProportion: "Estimate Proportion",
  estimateMean: "Estimate Mean",
  compareTwoProportionsCohort: "Cohort (Proportions)",
  compareTwoProportionsCaseControl: "Case-Control",
  compareTwoMeans: "Compare Two Means",
  parallelRct: "Parallel RCT",
  nonInferiorityTrial: "Non-Inferiority",
  crossoverTrial: "Crossover Trial",
};

function formatTime(ts: bigint): string {
  try {
    const ms = Number(ts);
    const d = new Date(ms);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function RecentCalculations() {
  const { data, isLoading } = useRecentCalculations();

  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Recent Calculations
        </h2>
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="recent.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div
          className="text-center py-8 text-muted-foreground text-sm"
          data-ocid="recent.empty_state"
        >
          No calculations yet. Use the calculator above.
        </div>
      ) : (
        <ul className="space-y-2" data-ocid="recent.list">
          {data.slice(0, 8).map((calc, idx) => (
            <li
              key={String(calc.id)}
              data-ocid={`recent.item.${idx + 1}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-background transition-colors group"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {STUDY_LABELS[calc.studyType] ?? calc.studyType}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {SUB_LABELS[calc.subType] ?? calc.subType}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-foreground">
                    n = {calc.resultN.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(calc.timestamp)}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
