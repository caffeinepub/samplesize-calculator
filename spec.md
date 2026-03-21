# SampleSize Calculator

## Current State
Three study categories: Descriptive, Analytic, Clinical Trials. No cluster RCT support.

## Requested Changes (Diff)

### Add
- New category "Cluster RCT" as fourth pill in HeroBand
- ClusterRctCalculator with Continuous and Binary tabs
- DEFF = 1+(m-1)*rho applied to simple n
- Results: n/arm and clusters/arm

### Modify
- HeroBand.tsx: add fourth pill
- App.tsx: handle cluster category

### Remove
- Nothing

## Implementation Plan
1. Add cluster formula functions to sampleSizeFormulas.ts
2. Create ClusterRctCalculator.tsx
3. Update HeroBand and App
