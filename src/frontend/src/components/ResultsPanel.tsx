interface ResultsPanelProps {
  resultN: number | null;
  perGroup?: boolean;
  formula?: string;
  methodology?: string;
  components?: { label: string; value: string }[];
  isLoading?: boolean;
}

export function ResultsPanel({
  resultN,
  perGroup = false,
  formula,
  methodology,
  components,
  isLoading,
}: ResultsPanelProps) {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Big number */}
      <div
        className="rounded-xl p-6 text-center"
        style={{ background: "oklch(93% 1.5% 220)" }}
        data-ocid="results.panel"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
          Required Sample Size
        </p>
        {isLoading ? (
          <div
            className="h-14 flex items-center justify-center"
            data-ocid="results.loading_state"
          >
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : resultN !== null ? (
          <>
            <p
              className="text-6xl font-bold text-foreground leading-none"
              data-ocid="results.success_state"
            >
              {resultN.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {perGroup ? "participants per group" : "total participants"}
            </p>
          </>
        ) : (
          <p
            className="text-muted-foreground text-sm mt-2"
            data-ocid="results.empty_state"
          >
            Fill in the form and click Calculate
          </p>
        )}
      </div>

      {/* Formula components */}
      {components && components.length > 0 && (
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Formula Components
          </p>
          <div className="grid grid-cols-2 gap-2">
            {components.map((c) => (
              <div
                key={c.label}
                className="bg-background rounded-lg p-2 text-center"
              >
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-sm font-semibold text-foreground">
                  {c.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Methodology */}
      {formula && (
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Formula
          </p>
          <p className="font-mono text-sm text-foreground bg-background rounded p-2">
            {formula}
          </p>
        </div>
      )}

      {methodology && (
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Methodology & Assumptions
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {methodology}
          </p>
        </div>
      )}
    </div>
  );
}
