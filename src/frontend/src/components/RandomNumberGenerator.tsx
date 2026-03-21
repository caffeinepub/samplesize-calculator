import { useState } from "react";

interface ResultItem {
  id: string;
  value: number;
}

interface HistoryEntry {
  id: string;
  numbers: number[];
  min: number;
  max: number;
}

export function RandomNumberGenerator() {
  const [min, setMin] = useState<string>("1");
  const [max, setMax] = useState<string>("100");
  const [count, setCount] = useState<string>("1");
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  function generate() {
    setError(null);
    const minVal = Number.parseInt(min);
    const maxVal = Number.parseInt(max);
    const countVal = Number.parseInt(count);

    if (
      Number.isNaN(minVal) ||
      Number.isNaN(maxVal) ||
      Number.isNaN(countVal)
    ) {
      setError("Please enter valid numbers in all fields.");
      return;
    }
    if (minVal >= maxVal) {
      setError("Minimum must be less than maximum.");
      return;
    }
    if (countVal < 1 || countVal > 1000) {
      setError("Count must be between 1 and 1000.");
      return;
    }
    const range = maxVal - minVal + 1;
    if (!allowDuplicates && countVal > range) {
      setError(
        `Cannot generate ${countVal} unique numbers in range ${minVal}\u2013${maxVal} (only ${range} possible values).`,
      );
      return;
    }

    let generated: number[];
    if (allowDuplicates) {
      generated = Array.from(
        { length: countVal },
        () => Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal,
      );
    } else {
      const pool = Array.from({ length: range }, (_, i) => i + minVal);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      generated = pool.slice(0, countVal);
    }

    const batchId = `${Date.now()}`;
    const newResults: ResultItem[] = generated.map((value, idx) => ({
      id: `${batchId}-${idx}`,
      value,
    }));
    const newEntry: HistoryEntry = {
      id: batchId,
      numbers: generated,
      min: minVal,
      max: maxVal,
    };

    setResults(newResults);
    setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);
  }

  function clearAll() {
    setResults([]);
    setHistory([]);
    setError(null);
  }

  const inputClass =
    "w-full border border-border rounded-lg px-3 py-2 text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-primary/40";
  const labelClass = "block text-sm font-medium text-foreground mb-1";

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="rng-min" className={labelClass}>
            Minimum
          </label>
          <input
            id="rng-min"
            type="number"
            className={inputClass}
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="e.g. 1"
          />
        </div>
        <div>
          <label htmlFor="rng-max" className={labelClass}>
            Maximum
          </label>
          <input
            id="rng-max"
            type="number"
            className={inputClass}
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="e.g. 100"
          />
        </div>
        <div>
          <label htmlFor="rng-count" className={labelClass}>
            How many numbers?
          </label>
          <input
            id="rng-count"
            type="number"
            className={inputClass}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            min={1}
            max={1000}
            placeholder="e.g. 1"
          />
        </div>
      </div>

      {/* Allow duplicates toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setAllowDuplicates((v) => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
            allowDuplicates ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              allowDuplicates ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm text-foreground">
          {allowDuplicates ? "Allow duplicates" : "Unique numbers only"}
        </span>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={generate}
          className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Generate
        </button>
        {(results.length > 0 || history.length > 0) && (
          <button
            type="button"
            onClick={clearAll}
            className="px-5 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-muted/30 border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Generated Numbers
            {results.length > 1 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({results.length} numbers, range {min}\u2013{max})
              </span>
            )}
          </h3>
          {results.length === 1 ? (
            <p className="text-5xl font-bold text-primary text-center py-4">
              {results[0].value}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {results.map((r) => (
                <span
                  key={r.id}
                  className="inline-block bg-white border border-border rounded-md px-3 py-1.5 text-sm font-medium text-foreground"
                >
                  {r.value}
                </span>
              ))}
            </div>
          )}
          {results.length > 1 && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
              <div>
                <div className="font-semibold text-foreground text-base">
                  {Math.min(...results.map((r) => r.value))}
                </div>
                <div>Min</div>
              </div>
              <div>
                <div className="font-semibold text-foreground text-base">
                  {Math.max(...results.map((r) => r.value))}
                </div>
                <div>Max</div>
              </div>
              <div>
                <div className="font-semibold text-foreground text-base">
                  {(
                    results.reduce((a, b) => a + b.value, 0) / results.length
                  ).toFixed(1)}
                </div>
                <div>Average</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Previous Generations
          </h3>
          <div className="space-y-2">
            {history.slice(1).map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between bg-muted/20 border border-border rounded-lg px-4 py-2 text-sm"
              >
                <span className="text-muted-foreground text-xs">
                  Range {h.min}\u2013{h.max}
                </span>
                <span className="font-medium text-foreground">
                  {h.numbers.length === 1
                    ? h.numbers[0]
                    : `${h.numbers.slice(0, 5).join(", ")}${
                        h.numbers.length > 5
                          ? ` +${h.numbers.length - 5} more`
                          : ""
                      }`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
