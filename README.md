# Trabzon Vernacular Inventory
## A Provenance-Aware Evidence Interface

Version 1.3 presents the complete 30-record researcher-validated subset with source images, working PDF page positions, and coded P1, P8, and P9 attributes. The source images document the inventory records; the interface remains a schematic representation rather than a measured reconstruction.

**Version:** 1.3.0 – 30 Validated Cases Build  
**Build date:** 2026-08-12

---

## Purpose

This tool organizes and displays information from 183 residential inventory records in Trabzon's historically designated urban conservation zones. It distinguishes descriptive evidence, limited record-level evidence, and schematic visualization inputs derived from the Trabzon Kent İçi Kültür Varlıkları Envanteri (Özen et al., 2010).

**Interpretive boundary:** This interface reports descriptive inventory evidence and visualization inputs. It does not evaluate architectural correctness, compatibility, authenticity, or design quality.

Three views are provided:

- **Design Explorer** — Adjust twelve parameters (P1–P12) and observe schematic changes alongside descriptive inventory evidence.
- **Evidence Explorer** — Browse and filter all 183 analysis records with full field visibility.
- **Method & Limits** — Understand how the evidence was collected, what each parameter does and does not support, and where researcher review is still required.

---

## How to Open

The project is designed to use relative paths for local file access and static hosting. Browser-specific operation must be verified before publication.

Open `index.html` directly in any modern browser. No server, build step, or internet connection is required. All data is loaded from `data/ascaad26-evidence-data.js` via a synchronous `<script>` tag. The load order in `index.html` (data script tag before the deferred app script) is mandatory.

**Do not rename files or move them between directories.**

---

## File Structure

```
trabzon-algorithmic-vernacular/
├── index.html                     Primary entry point
├── assets/
│   ├── styles.css                 Application stylesheet
│   └── inventory-cases-v2/        Source images for 30 validated records
├── data/
│   ├── ascaad26-evidence-data.js  Evidence dataset (window.ASCAAD26_EVIDENCE_DATA)
│   └── documented-cases.js        Validated case metadata and source-image paths
├── src/
│   └── app.js                     Application logic (vanilla JS, no dependencies)
├── README.md                      This file
└── TEST_REPORT.md                 Static acceptance test record
```

---

## Parameters

| ID | Name | Type | Range | Step | Starting Value |
|----|------|------|-------|------|----------------|
| P1 | Visible floor count | Integer | 1–5 | 1 | 3 |
| P2 | Building width (m) | Decimal | 5.0–16.0 | 0.5 | 9.5 |
| P3 | Building depth (m) | Decimal | 5.0–16.0 | 0.5 | 8.0 |
| P4 | Window-to-wall ratio | Decimal | 0.05–0.45 | 0.01 | 0.20 |
| P5 | Roof slope (°) | Integer | 15–65 | 1 | 38 |
| P6 | Eave depth (m) | Decimal | 0.20–2.00 | 0.05 | 0.90 |
| P7 | Storey height (m) | Decimal | 2.20–4.00 | 0.10 | 3.00 |
| P8 | Facade/construction material category | Categorical | 7 categories | — | stone+timber+bagdadi |
| P9 | Roof material (limited) | Categorical | `unknown/unavailable` · `tile (type unspecified)` · `metal sheet/mixed repair` | — | unknown/unavailable |
| P10 | Balcony depth (m) | Decimal | 0.00–2.00 | 0.05 | 1.00 |
| P11 | Balcony width ratio | Decimal | 0.10–1.00 | 0.05 | 0.55 |
| P12 | Wall thickness (m) | Decimal | 0.20–0.85 | 0.05 | 0.45 |

**P1** and **P8** are *Descriptive* parameters — frequency distributions based on the full 183-record analysis dataset.  
**P9** is a *Limited record-level* parameter — observable in 53 of 183 records (29.0%); coverage is area-imbalanced and is not generalized.  
**P2–P7** and **P10–P12** are *Visualization-only* parameters — no validated building-level inventory measurement exists for these in this dataset. Ranges are technical rendering constraints only.

## Input Feedback & Evidence Context

The Design Explorer includes a non-evaluative feedback panel that responds when a parameter changes:

- P1 reports the selected floor count's observed frequency and identifies the most frequent observed value as descriptive context.
- P8 reports the selected material category's categorical frequency and the most frequent observed category.
- P9 repeats the limited-evidence and area-imbalance boundary for the selected roof palette.
- P2–P7 and P10–P12 report whether a technical rendering input was applied, rejected for being outside its display range, or aligned to the nearest permitted display step.

Technical range feedback is input validation only. It is not derived from inventory measurements and does not judge architectural suitability. Frequency comparisons are descriptive and do not instruct the user to change a design.

---

## Evidence Basis

| Metric | Value |
|--------|------:|
| Inventory codes | 265 |
| Independent candidate records | 264 |
| Detailed analysis records | 183 |
| — of which: included | 146 |
| — of which: partially included | 37 |
| Excluded from analysis | 81 |

One combined inventory sheet carries two codes; therefore 265 codes correspond to 264 independent candidate records.

- **Researcher confirmation:** 30 records collectively confirmed by the research team (stratified, exception-inclusive; 2026-08-12).
- **Remaining records requiring researcher review:** 153

**Validation limitation:** The researcher collectively reviewed the existing P1 states and P8 codes in the selected 30-record sample. Four P1 states remain unavailable. The review was not an independent blind recoding exercise; therefore, it must not be interpreted as inter-rater reliability, model accuracy, or a guarantee for all 183 records.

Statistical independence of P1 and P8 was tested (chi-square = 5.013, N = 148, df = 2, p = 0.082, Cramér's V = 0.184). The result is not statistically significant at α = 0.05. No automatic relationship between P1 and P8 is implemented.

---

## Data Provenance

The evidence dataset is derived from:

> Trabzon Kent İçi Kültür Varlıkları Envanteri (Özen et al., 2010), pages 291–448.

The JavaScript data file (`ascaad26-evidence-data.js`) is the authoritative, immutable source of record for this application. Its content must not be modified.

---

## What This Tool Does Not Do

This tool does **not**:
- Generate an overall compatibility score, vernacularity rating, or design quality index
- Produce AI confidence values, probability estimates, or calibrated assessments
- Issue pass/fail, compliant/non-compliant, or correct/incorrect status for any configuration
- Recommend automatic design changes
- Implement a P1→P8 conditional rule (the chi-square test does not support one)
- Assert any relationship between roof slope (P5) and eave depth (P6)
- Make any network requests, use cookies, or load external resources

---

## Browser Requirements

Requires a modern browser supporting CSS Grid, the `<dialog>` element, CSS custom properties, and SVG. No JavaScript frameworks, build tools, polyfills, or internet connection are required.

---

## Accessibility

The interface supports keyboard navigation throughout, screen-reader landmarks and ARIA roles, focus management in the record detail dialog, and `prefers-reduced-motion` for all CSS transitions. Minimum touch target size is 44×44 px on mobile viewports.
