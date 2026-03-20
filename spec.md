# SampleSize Calculator

## Current State
New project. No existing application files.

## Requested Changes (Diff)

### Add
- Sample size calculator for three study types: Descriptive, Analytic, and Clinical Trial
- Each study type supports multiple sub-types/formulas
- Results display with formula details and methodology notes

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko)
- `calculateDescriptive`: Sample size for estimating a proportion (z-based) and estimating a mean
- `calculateAnalytic`: Sample size for comparing two proportions (cohort/cross-sectional, case-control) and comparing two means
- `calculateClinicalTrial`: Sample size for parallel RCT (superiority, non-inferiority) and crossover trial
- All functions return calculated sample size + formula components (z-scores, effect size, etc.)
- Save recent calculations to stable storage

### Frontend
- Three-tab layout: Descriptive Studies | Analytic Studies | Clinical Trials
- Each tab has sub-type selector and dynamic form fields
- Results panel shows calculated n, formula breakdown, methodology notes
- Recent calculations list
- Responsive, professional medical/research aesthetic
