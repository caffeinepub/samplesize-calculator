// Z-values for confidence levels
export const Z_ALPHA: Record<string, number> = {
  "90": 1.645,
  "95": 1.96,
  "99": 2.576,
};

// Z-values for power (one-sided)
export const Z_BETA: Record<string, number> = {
  "80": 0.842,
  "90": 1.282,
  "95": 1.645,
};

export function getZAlpha(confidenceLevel: string): number {
  return Z_ALPHA[confidenceLevel] ?? 1.96;
}

export function getZBeta(power: string): number {
  return Z_BETA[power] ?? 0.842;
}

// ---- DESCRIPTIVE ----

export function calcEstimateProportion(
  confidenceLevel: string,
  p: number,
  d: number,
): number {
  const z = getZAlpha(confidenceLevel);
  return Math.ceil((z ** 2 * p * (1 - p)) / d ** 2);
}

export function calcEstimateMean(
  confidenceLevel: string,
  sigma: number,
  d: number,
): number {
  const z = getZAlpha(confidenceLevel);
  return Math.ceil((z ** 2 * sigma ** 2) / d ** 2);
}

// ---- ANALYTIC ----

export function calcCompareTwoProportionsCohort(
  confidenceLevel: string,
  power: string,
  p1: number,
  p2: number,
  ratio: number,
): number {
  const za = getZAlpha(confidenceLevel);
  const zb = getZBeta(power);
  const pBar = (p1 + p2) / 2;
  const numerator =
    (za * Math.sqrt((1 + 1 / ratio) * pBar * (1 - pBar)) +
      zb * Math.sqrt(p1 * (1 - p1) + (1 / ratio) * p2 * (1 - p2))) **
    2;
  const denominator = (p1 - p2) ** 2;
  return Math.ceil(numerator / denominator);
}

export function calcCompareTwoProportionsCaseControl(
  confidenceLevel: string,
  power: string,
  pControl: number,
  or: number,
  ratio: number,
): number {
  const za = getZAlpha(confidenceLevel);
  const zb = getZBeta(power);
  const pCase = (or * pControl) / (1 + (or - 1) * pControl);
  const pBar = (pCase + pControl) / 2;
  const numerator =
    (za * Math.sqrt((1 + 1 / ratio) * pBar * (1 - pBar)) +
      zb *
        Math.sqrt(
          pCase * (1 - pCase) + (1 / ratio) * pControl * (1 - pControl),
        )) **
    2;
  const denominator = (pCase - pControl) ** 2;
  return Math.ceil(numerator / denominator);
}

export function calcCompareTwoMeans(
  confidenceLevel: string,
  power: string,
  mean1: number,
  mean2: number,
  pooledSD: number,
): number {
  const za = getZAlpha(confidenceLevel);
  const zb = getZBeta(power);
  const delta = Math.abs(mean1 - mean2);
  return Math.ceil((2 * (za + zb) ** 2 * pooledSD ** 2) / delta ** 2);
}

// ---- CLINICAL TRIALS ----

export function calcParallelRctContinuous(
  confidenceLevel: string,
  power: string,
  mean1: number,
  mean2: number,
  sd: number,
): number {
  const za = getZAlpha(confidenceLevel);
  const zb = getZBeta(power);
  const delta = Math.abs(mean1 - mean2);
  return Math.ceil((2 * (za + zb) ** 2 * sd ** 2) / delta ** 2);
}

export function calcParallelRctProportion(
  confidenceLevel: string,
  power: string,
  p1: number,
  p2: number,
): number {
  const za = getZAlpha(confidenceLevel);
  const zb = getZBeta(power);
  const pBar = (p1 + p2) / 2;
  const numerator =
    (za * Math.sqrt(2 * pBar * (1 - pBar)) +
      zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) **
    2;
  const denominator = (p1 - p2) ** 2;
  return Math.ceil(numerator / denominator);
}

export function calcNonInferiority(
  confidenceLevel: string,
  power: string,
  mean1: number,
  mean2: number,
  sd: number,
  delta: number,
): number {
  const za = getZAlpha(confidenceLevel);
  const zb = getZBeta(power);
  const diff = delta - Math.abs(mean1 - mean2);
  if (diff <= 0) return 0;
  return Math.ceil((2 * (za + zb) ** 2 * sd ** 2) / diff ** 2);
}

export function calcCrossover(
  confidenceLevel: string,
  power: string,
  meanDiff: number,
  withinSD: number,
): number {
  const za = getZAlpha(confidenceLevel);
  const zb = getZBeta(power);
  return Math.ceil((2 * (za + zb) ** 2 * withinSD ** 2) / meanDiff ** 2);
}
