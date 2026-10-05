# TEST REPORT

## Trabzon Vernacular Inventory Interface — v1.3.0

**Test date:** 2026-10-05  
**Scope:** Static source inspection, dataset comparison, JavaScript syntax checks, source-image verification, and local HTTP asset checks.

## Verified

| Check | Result |
| --- | --- |
| Documented-case cards | PASS — 30 researcher-validated cases are defined. |
| Source images | PASS — 30 corresponding inventory-record images exist. |
| Workbook agreement | PASS — all 30 case records match the validated workbook fields used by the interface. |
| P1 unavailable values | PASS — 4 cases remain explicitly unavailable; no value is inferred from the image. |
| P9 observable values | PASS — 5 cases display observable P9 data; other cases remain unavailable. |
| Evidence classes | PASS — P1/P8 are descriptive, P9 is limited, and P2–P7/P10–P12 are labelled visualization-only. |
| Source traceability | PASS — each documented case includes record code, area, PDF page, source filename, and a source-record view. |
| Dataset scope | PASS — 264 independent candidates; 183 analysed; 146 included; 37 partially included; 81 excluded. |
| Exclusion statement | PASS — 56 non-residential and 25 reinforced-concrete/reconstructed records. |
| Statistical statement | PASS — chi-square(2, N=148)=5.013, p=.082, Cramer's V=.184; no design rule is inferred. |
| AI boundary | PASS — the interface performs no live AI inference and makes no model-accuracy claim. |
| Shape-grammar boundary | PASS — the interface is not described as a shape grammar or a dynamic rule system. |
| User-study boundary | PASS — no usability, comprehension, or interpretive-effectiveness claim is made. |
| JavaScript syntax | PASS — Node syntax checks passed for the application and data files. |
| Local HTTP assets | PASS — the home page, application script, documented-case data, and a sample image returned HTTP 200. |

## Automated validation output

```json
{
  "cases": 30,
  "p1_unavailable": 4,
  "p9_observable": 5,
  "images": 30,
  "dataset_matches": 30,
  "static_checks": "passed"
}
```

## Not tested in this environment

- Full interaction in an installed browser, including keyboard and dialog focus behavior.
- Responsive visual inspection at desktop, tablet, and mobile widths.
- File-download behavior for CSV, JSON, and SVG exports.
- Final GitHub Pages behavior after deployment.

These items must be checked after publishing. This report does not claim that browser usability, accessibility, or responsive-layout testing has passed.
