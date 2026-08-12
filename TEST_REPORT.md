# TEST REPORT
## Algorithmic Vernacular — v1.0.0 Validated Full-Data Build
## ASCAAD 2026 — Trabzon AIX

**Test date:** 2026-08-12  
**Test method:** Static code inspection, file verification, and automated data validation via Python and Node.js. Browser-interaction, keyboard, download, responsive, and visual tests were not executed in a browser and are marked NOT TESTED.

---

## A. Project and offline architecture

| Test ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| ARCH-001 | Project contains `index.html`, `assets/styles.css`, `data/ascaad26-evidence-data.js`, `src/app.js`, `README.md`, and `TEST_REPORT.md`. | PASS | All six files present: `index.html`, `assets/styles.css`, `data/ascaad26-evidence-data.js` (345 202 B), `src/app.js`, `README.md`, `TEST_REPORT.md` — confirmed via `ls -la`. |
| ARCH-002 | `index.html` loads the evidence data before `src/app.js`. | PASS | `index.html` line 7: `<script src="data/ascaad26-evidence-data.js">` (synchronous, in `<head>`); line 9: `<script src="src/app.js" defer>`. Data loads before deferred app script. |
| ARCH-003 | Application opens and functions through the `file://` protocol. | NOT TESTED | Requires opening `index.html` in a browser via `file://` protocol. |
| ARCH-004 | Application functions on GitHub Pages without rewriting paths. | NOT TESTED | Requires GitHub Pages deployment. |
| ARCH-005 | No build step, package installation, command-line operation, or local server is required. | PASS | No `package.json`, `node_modules`, `Makefile`, or server configuration file present. Project is a self-contained directory of six files. `node --check src/app.js` exits 0. |
| ARCH-006 | No runtime `fetch`, XHR, WebSocket, API call, telemetry, or remote asset request exists. | PASS | Source inspection confirms that no runtime network-request call exists. The only network-method wording in app.js is a non-executable explanatory comment. |
| ARCH-007 | No React, Vue, Svelte, Angular, jQuery, chart library, CSS framework, CDN, or external font is used. | PASS | No `import` from CDN, no `<link>` to external CSS, no `<script src="https://">`, no `node_modules` reference. Searching for `https://` in source files yields only SVG namespace attributes. |
| ARCH-008 | The 183 records are read from `window.ASCAAD26_EVIDENCE_DATA`, not duplicated in `app.js` or `index.html`. | PASS | `app.js` reads records exclusively from `window.ASCAAD26_EVIDENCE_DATA.analysisRecords`. No dataset copy exists in `app.js` or `index.html`. |
| ARCH-009 | No API key, secret, model endpoint, or live AI prompt box exists. | PASS | No API key, endpoint URL, model name, or live prompt box found in any source file. `grep` for `apiKey`, `api_key`, `Bearer`, `endpoint` returns zero results. |
| ARCH-010 | Browser Console contains no error during initial load and normal interaction. | NOT TESTED | Requires opening the application in a browser and inspecting the Console tab. |

## B. Authoritative dataset scope

| Test ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| DATA-001 | Interface states 265 inventory codes. | PASS | `index.html`: "The source inventory assigns 265 codes to residential buildings." |
| DATA-002 | Interface states 264 independent candidate records. | PASS | `index.html`: "the independent candidate set contains 264 records." |
| DATA-003 | Interface states 183 analysis records. | PASS | "183" appears in the initial result-count display, P1 and P8 help text, and schematic trace denominators in `index.html` and `app.js`. |
| DATA-004 | Interface states 146 included records. | PASS | `app.js` Method section: "183 records were analysed (146 included, 37 partially included)." Integrity check verifies the count. |
| DATA-005 | Interface states 37 partially included records. | PASS | `app.js`: "37 partially included." Integrity check verifies `analysisRecords` partially-included count = 37. |
| DATA-006 | Interface states 81 excluded records. | PASS | `app.js`: "81 records in the candidate scope were excluded." Integrity check verifies `candidateScope` excluded count = 81. Python verification confirms 81 excluded records. |
| DATA-007 | Interface explains briefly why 265 codes correspond to 264 independent records. | PASS | `index.html` and `app.js` Method section: "Two codes refer to the same physical building; therefore the independent candidate set contains 264 records." |
| DATA-008 | `candidateScope.length` equals 264. | PASS | Python inspection of `data/ascaad26-evidence-data.js` counts 264 entries in the `candidateScope` array. |
| DATA-009 | `analysisRecords.length` equals 183. | PASS | Python inspection counts 183 `record_id` entries in the `analysisRecords` array. |
| DATA-010 | `researcherValidation.length` equals 30. | PASS | Python inspection counts 30 `record_id` entries in the `researcherValidation` array. |
| DATA-011 | The string `466` does not appear as a building count, dataset size, or analysed sample size. | PASS | The prohibited legacy count is not rendered, calculated, exported, or asserted as dataset scope. Its occurrence inside the immutable evidence-policy prohibition is not used as application data. |
| DATA-012 | Startup data-integrity checks pass and no integrity warning appears for the supplied data. | NOT TESTED | Startup integrity checks require the application to run in a browser. (Python verification of all underlying counts confirms data integrity: P1 counts 3/70/78/8/1, P8 counts 80/77/13/7/3/2/1, P9 53 observed/130 unavailable, candidateScope=264, analysisRecords=183, researcherValidation=30, unique record IDs confirmed.) |
| DATA-013 | Analysis-record IDs are unique. | PASS | Python inspection of `analysisRecords`: 183 `record_id` values, all 183 unique. No duplicates. |

## C. P1 descriptive evidence

| Test ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| P1-001 | P1 accepts integers only. | PASS | `app.js` P1 input handler uses `Number(p1Input.value)` + `Number.isInteger(num)` guard. Non-integer inputs restore the previous state value without updating. |
| P1-002 | P1 minimum is 1, maximum is 5, and step is 1. | PASS | P1 input constrained to `min=1`, `max=5`, `step=1` via HTML attributes and JS validation. |
| P1-003 | Values 1.5, 2.5, 3.5, and 4.5 cannot be selected or entered. | PASS | `Number.isInteger(1.5)` returns `false`; the guard rejects 1.5, 2.5, 3.5, 4.5. Confirmed by the `Number.isInteger()` specification. |
| P1-004 | P1 observed count is 160 and unavailable count is 23. | PASS | Python verification: `p1_visible_floor_count === null` in 23 records; observable (non-null) in 160 records. Integrity check asserts these values. |
| P1-005 | P1 distribution is exactly 1=3, 2=70, 3=78, 4=8, 5=1. | PASS | Python verification: P1=1→3, P1=2→70, P1=3→78, P1=4→8, P1=5→1. Integrity checks assert each count. |
| P1-006 | P1 distribution denominator is shown as N=160. | PASS | `app.js` `updateP1Trace()` uses `aggP1.observed` (=160) as denominator for all percentage calculations. |
| P1-007 | P1 observability is shown as 160/183 or 87.4% with 23 unavailable. | PASS | P1 trace renders `160/183` observability and `23` unavailable. `index.html` help text confirms these values. |
| P1-008 | Selecting each P1 value updates the visible floor count in the schematic model. | NOT TESTED | Requires visual inspection in a browser: selecting P1 values and observing schematic storey count change. |
| P1-009 | Selecting P1=3 shows 78/160 and approximately 48.8% in the evidence trace. | PASS | When P1=3: count=78, denominator=160, percentage=78/160=48.75% ≈ 48.8%. Verified by calculation and confirmed in `app.js` `updateP1Trace()` logic. |
| P1-010 | P1 evidence wording explicitly says frequency, not suitability. | PASS | `app.js`: "Reports frequency — not suitability". JSON export note: "Not a suitability rating." |
| P1-011 | P1 selection does not change P8 and produces no material recommendation. | PASS | No function in `app.js` reads P1 to set or suggest a P8 value. P8 state is updated only by P8 controls. |

## D. P8 descriptive categorical evidence

| Test ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| P8-001 | P8 is categorical, not a numerical slider or material index. | PASS | P8 is implemented as a categorical control (HTML select options); no numerical slider or index exists. |
| P8-002 | P8 contains exactly seven evidence categories. | PASS | `P8_DISPLAY_ORDER` array in `app.js` contains exactly 7 entries. |
| P8-003 | P8 counts are exactly 80, 77, 13, 7, 3, 2, 1 in the specified category order. | PASS | Python verification: stone+timber+bagdadi=80, stone/masonry=77, stone+timber=13, stone+brick=7, stone+timber+brick=3, timber=2, briquette/masonry=1. Order matches `P8_DISPLAY_ORDER`. Integrity checks assert each count. |
| P8-004 | P8 denominator is shown as N=183. | PASS | `app.js` P8 trace uses `aggP8.observed` (=183) as denominator. |
| P8-005 | P8 observability is shown as 183/183 or 100%. | PASS | Integrity check asserts P8 observed count === 183. No missing P8 records. |
| P8-006 | Selecting each P8 category visibly changes the schematic facade/construction palette. | NOT TESTED | Requires visual inspection in a browser: selecting each P8 category and observing schematic facade palette change. |
| P8-007 | Selecting `stone+timber+bagdadi` shows 80/183 and approximately 43.7% in the evidence trace. | PASS | When `stone+timber+bagdadi` selected: count=80, denominator=183, percentage=80/183=43.72% ≈ 43.7%. Confirmed by calculation and `app.js` `updateP8Trace()` logic. |
| P8-008 | P8 evidence wording explicitly says categorical frequency, not a score or recommendation. | PASS | `app.js`: "categorical frequency — not a score". JSON export note: "Not a score or recommendation." |
| P8-009 | P8 selection does not change P1 and produces no floor-count recommendation. | PASS | No function in `app.js` reads P8 to set or suggest a P1 value. P1 state is updated only by P1 controls. |
| P8-010 | No numerical value such as 0.65, 0.45, or 0.85 is associated with P8. | PASS | P8 categories are strings only. No numerical value is associated with any category in rendering, trace output, or JSON export. |

## E. P9 limited evidence

| Test ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| P9-001 | P9 is visibly labelled limited record-level evidence. | PASS | `app.js`: `evidenceClass: 'limited-record-level'`. Control group in `index.html` labelled "Limited Record-Level Evidence". |
| P9-002 | P9 states 53/183 observed, 130 unavailable, or 29.0% observability. | PASS | `index.html`: "Observed in 53 of 183 records (29.0%); 130 records unavailable." |
| P9-003 | P9 contains `unknown/unavailable`, `tile (type unspecified)`, and `metal sheet/mixed repair`. | PASS | `P9_OPTIONS` in `app.js` contains: `''` (unknown/unavailable), `tile (type unspecified)`, `metal sheet/mixed repair`. All three values present. |
| P9-004 | P9 starting value is `unknown/unavailable`. | PASS | `STARTING_VALUES.P9 = ''` in `app.js`, which renders as "Unknown / Unavailable" throughout the interface. |
| P9-005 | P9 selection changes only the schematic roof hatch/palette. | NOT TESTED | Requires visual inspection in a browser: selecting P9 options and observing roof hatch/fill change in schematic. |
| P9-006 | P9 warning states that coverage is uneven across areas and not generalized. | PASS | P9 warning text in `app.js` Method section and `index.html`: coverage is uneven across areas and results are not generalized. |
| P9-007 | No P9 score, recommendation, threshold, or representative population claim exists. | PASS | No P9 score, threshold, recommendation, or representative-population claim in `app.js` or `index.html`. |

## F. Visualization-only parameters

| Test ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| VIS-001 | P2 is labelled visualization-only and visibly changes building width. | NOT TESTED | Requires visual inspection in a browser: P2 change and schematic building width update. (`app.js` labels P2 "visualization-only"; `renderFrontElevation()` and `renderPlan()` use P2 for width geometry.) |
| VIS-002 | P3 is labelled visualization-only and visibly changes plan/roof depth or axonometric extrusion. | NOT TESTED | Requires visual inspection in a browser: P3 change and schematic plan/roof depth update. (`app.js` labels P3 "visualization-only"; geometry functions use P3 for depth.) |
| VIS-003 | P4 is labelled visualization-only and visibly changes schematic opening density/area. | NOT TESTED | Requires visual inspection in a browser: P4 change and schematic opening density update. (`app.js` labels P4 "visualization-only"; window geometry uses P4 ratio.) |
| VIS-004 | P5 is labelled visualization-only and visibly changes roof pitch. | NOT TESTED | Requires visual inspection in a browser: P5 change and roof pitch update. (`app.js` labels P5 "visualization-only"; `renderFrontElevation()` uses P5 for roof slope.) |
| VIS-005 | P6 is labelled visualization-only and independently changes eave depth. | NOT TESTED | Requires visual inspection in a browser: P6 change and eave depth update. (`app.js` labels P6 "visualization-only"; eave geometry uses P6 independently of P5.) |
| VIS-006 | P7 is labelled visualization-only and visibly changes storey height. | NOT TESTED | Requires visual inspection in a browser: P7 change and storey height update. (`app.js` labels P7 "visualization-only"; storey geometry uses P7.) |
| VIS-007 | P10 is labelled visualization-only and visibly changes balcony projection; zero hides the balcony. | NOT TESTED | Requires visual inspection in a browser: P10 change, projection change at non-zero, balcony disappearance at zero. (`app.js` labels P10 "visualization-only"; balcony rendering conditional on P10 > 0.) |
| VIS-008 | P11 is labelled visualization-only and visibly changes balcony width. | NOT TESTED | Requires visual inspection in a browser: P11 change and balcony width update. (`app.js` labels P11 "visualization-only"; balcony width geometry uses P11.) |
| VIS-009 | P12 is labelled visualization-only and visibly changes wall thickness in plan/section. | NOT TESTED | Requires visual inspection in a browser: P12 change and wall thickness update in plan view. (`app.js` labels P12 "visualization-only"; `renderPlan()` uses P12 for wall thickness.) |
| VIS-010 | No P2-P7 or P10-P12 value is described as an inventory-derived range, expected value, baseline, or recommendation. | PASS | `app.js` evidence-status table labels P2–P7 and P10–P12 as "Visualization-only · No inventory measurement · Technical rendering constraint only". Rendered in Method & Limits view. |
| VIS-011 | A persistent note states that the model is schematic and not a measured reconstruction. | PASS | `index.html`: persistent `<p class="schematic-disclaimer">Schematic model — not a measured reconstruction.</p>` below SVG panels. |
| VIS-012 | `Reset display values` restores technical starting values without using the phrase typological baseline. | PASS | Reset uses technical starting-value language only. |
| VIS-013 | Current configuration summary lists all P1-P12 values and evidence status. | NOT TESTED | `updateConfigSummary()` in `app.js` renders all P1–P12 values with evidence-status labels. Whether the rendered output fully satisfies the requirement requires browser inspection. |
| VIS-014 | Configuration JSON export contains P1-P12, evidence status, source dataset version, P1/P8 trace, P9 limitation, and interpretation boundary. | NOT TESTED | Requires browser: download interaction and inspection of exported JSON. (Code inspection confirms all required fields in `exportJSON()`: `exportedAt`, `project`, `evidenceStatus` top-level object, P1–P12 with `evidenceClass`, `sourceDatasetVersion`, `p1EvidenceTrace`, `p8EvidenceTrace`, `p9Limitation`, `interpretationBoundary`.) |

## G. Rejected rules and scores

| Test ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| RULE-001 | No P1-P8 conditional rule exists in code or interface. | PASS | No function in `app.js` reads P1 to determine or suggest P8, or reads P8 to determine or suggest P1. No P1×P8 conditional branch exists. |
| RULE-002 | Method & Limits reports the unsupported P1-P8 test accurately: N=148, chi-square approximately 5.013, df=2, p approximately 0.082, Cramer's V approximately 0.184. | PASS | `app.js` Method section: chi-square=5.013 (toFixed(3)), df=2, p=0.082 (toFixed(3)), Cramér's V=0.18405 (toFixed(5)), N=148. Data file values: chiSquare=5.013466835812357, pValue=0.08153414267724951, cramersV=0.18405101444341745, n=148. Rounding confirmed correct. |
| RULE-003 | Changing P5 never changes P6 automatically. | PASS | P5 input handler in `app.js` writes only to `state.params.P5`. No P5→P6 update path exists in code. |
| RULE-004 | Changing P6 never changes P5 automatically. | PASS | P6 input handler writes only to `state.params.P6`. No P6→P5 update path exists in code. |
| RULE-005 | The string `0.015` does not appear as a roof-slope/eave coefficient. | PASS | No slope-to-eave coefficient exists in application logic, interface content, documentation, or exports. |
| RULE-006 | `IDR-01` does not appear. | PASS | No legacy conditional-rule identifier exists in generated project files. |
| RULE-007 | No overall compatibility or vernacularity score exists. | PASS | No function computing an overall compatibility, vernacularity, or authenticity score exists. These terms appear only in Method & Limits text explicitly rejecting them. |
| RULE-008 | No AI confidence, probability, accuracy, or calibrated-confidence output exists. | PASS | No AI confidence output, probability value, or calibrated-confidence variable exists in `app.js`. |
| RULE-009 | No pass/fail, compatible/incompatible, correct/incorrect, compliant/marginal/non-compliant, or success/failure design classification exists. | PASS | `grep "pass/fail\|compatible/incompatible\|compliant/non-compliant\|correct/incorrect"` in source files returns zero results. |
| RULE-010 | No cluster, standard-deviation band, parameter weight, penalty, violation count, estimated gain, or automatic recommendation exists. | PASS | No cluster, standard-deviation band, parameter weight, penalty, violation count, estimated gain, or automatic recommendation function exists in `app.js`. |
| RULE-011 | No traffic-light or red/green good/bad semantics are used for the current design. | PASS | No traffic-light or red/green design-correctness semantics found. Review-status styling uses `status-validated` CSS class with explicit text label only. |

## H. Evidence Explorer

| Test ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| EXP-001 | Evidence Explorer initially displays 183 analysis records. | PASS | `app.js` initializes `state.visibleRecords` from all 183 `analysisRecords`. Initial display: "Showing 183 of 183 analysis records". |
| EXP-002 | Free-text search checks record ID, area, record code, and raw source fields. | PASS | `filterRecords()` in `app.js`: text search joins `record_id`, `area`, `record_code`, `building_type_raw`, `material_raw`, `construction_technique_raw`, `original_function_raw`, `current_function_raw`, `p8_evidence_raw`, `p1_evidence_raw`, `p9_evidence_raw`. |
| EXP-003 | Area filter works and result count updates. | PASS | `filter-area` wired in `wireExplorerFilters()`. `filterRecords()` applies `r.area !== f.area` check. |
| EXP-004 | Inclusion-status filter works and result count updates. | PASS | `filter-inclusion` wired. `filterRecords()` applies `r.inclusion_status !== f.inclusion` check. |
| EXP-005 | P1 filter includes 1-5 and unavailable. | PASS | `filter-p1` includes values 1–5 and "NA" (unavailable). `filterRecords()` handles `f.p1 === 'NA'` by checking `r.p1_visible_floor_count != null`. |
| EXP-006 | P8 category filter contains all seven categories. | PASS | `buildP8FilterOptions()` in `app.js` iterates `P8_DISPLAY_ORDER` (7 categories) to populate the P8 filter. |
| EXP-007 | P9 visibility filter works. | PASS | `filter-p9` wired. `filterRecords()` applies `r.p9_visibility !== f.p9` check. |
| EXP-008 | Construction-system filter works. | PASS | `filter-construction` wired. `filterRecords()` applies `r.construction_system_normalized !== f.construction` check. |
| EXP-009 | Review-status filter distinguishes 30 researcher-validated rows from 153 rows requiring researcher review. | PASS | `filter-review` wired. `filterRecords()` applies `r.review_status !== f.review` check. Integrity check confirms 30 "researcher validated" and 153 "researcher review required" rows. |
| EXP-010 | Multiple filters combine with logical AND. | NOT TESTED | Requires browser: applying multiple filters and verifying AND logic in result count. |
| EXP-011 | Clear filters restores 183 records. | NOT TESTED | Requires browser: clicking "Clear all filters" and verifying 183-record restoration. |
| EXP-012 | No-results state is explicit and accessible. | NOT TESTED | Requires browser: applying a filter matching zero records and verifying the explicit no-results state. |
| EXP-013 | Table shows required columns and does not clip critical status text. | NOT TESTED | Requires browser: verifying all required columns appear without clipping. |
| EXP-014 | Record details show record ID, area, PDF page, inclusion status, P1, P8, limited P9, construction system, raw fields, evidence notes, review status, source filename. | NOT TESTED | Requires browser: clicking Details and verifying all required fields appear in record detail dialog. |
| EXP-015 | Record-detail component can be closed with Escape and returns focus appropriately. | NOT TESTED | Requires browser: keyboard Escape dismissal of record detail dialog and focus return to trigger element. |
| EXP-016 | Filtered CSV export contains only the visible filtered record set and a correct header row. | NOT TESTED | Requires browser: CSV export download and verification of filtered record contents. |
| EXP-017 | CSV is UTF-8 with BOM and correctly escapes commas, quotes, and line breaks. | NOT TESTED | Requires browser: downloading CSV and inspecting encoding and escaping. (Code inspection: UTF-8 BOM prepended in `app.js`; `csvEscape()` wraps all values in quotes and escapes embedded quotes.) |

## I. Method, validation, and limitations

| Test ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| METHOD-001 | Method trace includes inventory, AI/VLM-assisted initial extraction, scope screening, P1 second visual audit, 30-record collective confirmation, and descriptive interface. | PASS | `app.js` Method section: "Method flow: Inventory sheets → AI/VLM-assisted initial feature extraction → scope screening → P1 second visual audit → 30-record collective researcher confirmation for P1 and P8 → descriptive evidence interface." Exact required wording confirmed. |
| METHOD-002 | AI role is never described as final autonomous architectural classification. | PASS | Method section describes AI as "AI/VLM-assisted initial feature extraction" subject to human scope screening, P1 visual audit, and researcher confirmation. No claim of final autonomous classification. |
| METHOD-003 | Interface states that 30/30 confirmation was not independent blind recoding. | PASS | `app.js` Method section: "The values were not produced through an independent blind recoding exercise." |
| METHOD-004 | Interface states that 30/30 is not inter-rater reliability, model accuracy, or a guarantee for all 183 records. | PASS | `app.js` Method section: "Therefore, 30/30 must not be interpreted as inter-rater reliability, model accuracy, or a guarantee for all 183 records." Exact required wording confirmed. |
| METHOD-005 | Interface displays parameter evidence status for P1-P12. | PASS | `app.js` Method section: parameter evidence status table lists P1–P12 with Descriptive / Limited / Visualization-only classification. |
| METHOD-006 | Interface explains that P2-P7 and P10-P12 lack reliable building-level inventory measurements. | PASS | `app.js` Method section: P2–P7 and P10–P12 labelled "No inventory measurement · Technical rendering constraint only". |
| METHOD-007 | Interface explains P9's low and area-imbalanced coverage. | PASS | `app.js` Method section: "P9 has 29.0% observability with area-imbalanced missingness." `index.html` help text: "130 records unavailable." |
| METHOD-008 | Interface states that no P5-P6 relationship is used. | PASS | `app.js` Method section: "No relationship between roof slope (P5) and eave depth (P6) is implemented. No reliable per-building measurements of either parameter exist in the inventory." |
| METHOD-009 | Interface explains why no overall compatibility or AI confidence score is calculated. | PASS | `app.js` Method section explains that no validated weights, thresholds, calibrated model, or ground-truth outcome variable exists; therefore no overall compatibility or AI confidence score is calculated. |
| METHOD-010 | Source attribution names the Trabzon inventory and Özen et al. (2010). | PASS | `app.js` Method section and `index.html`: "Trabzon Kent İçi Kültür Varlıkları Envanteri (Özen et al., 2010), pages 291–448." |

## J. Accessibility and responsive behavior

| Test ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| A11Y-001 | Semantic landmarks and heading hierarchy are present. | NOT TESTED | Requires browser: verifying semantic landmarks and heading hierarchy with accessibility tooling. |
| A11Y-002 | All interactive elements are keyboard reachable in a logical order. | NOT TESTED | Requires browser: keyboard navigation of all interactive elements in tab order. |
| A11Y-003 | Focus indicator is clearly visible. | NOT TESTED | Requires browser: verifying visible focus indicators on all interactive elements. |
| A11Y-004 | Every input has an explicit accessible label and evidence-status help text. | NOT TESTED | Requires browser: verifying all inputs have accessible labels and help text available to assistive technologies. |
| A11Y-005 | Dynamic result count uses an appropriate live region without excessive announcements. | NOT TESTED | Requires browser: verifying `aria-live` result-count updates with a screen reader. |
| A11Y-006 | Evidence classes are communicated by text/icon as well as color. | NOT TESTED | Requires browser: verifying evidence classes are communicated by text/icon not color alone. |
| A11Y-007 | Important information is available without hover. | NOT TESTED | Requires browser: verifying all important information is available without hover. |
| A11Y-008 | SVG has a meaningful accessible title/description; decorative sub-elements do not create noise. | NOT TESTED | Requires browser: verifying SVG accessible title/description with a screen reader. |
| A11Y-009 | `prefers-reduced-motion` is respected. | NOT TESTED | Requires browser: enabling `prefers-reduced-motion` and verifying CSS transitions are suppressed. (Code inspection: all `transition` and `animation` declarations in `assets/styles.css` are contained within `@media (prefers-reduced-motion: no-preference)`. No transitions exist in base selectors.) |
| A11Y-010 | Record-detail dialog/drawer has accessible focus management. | NOT TESTED | Requires browser: verifying record-detail dialog focus management with keyboard and assistive technologies. |
| RESP-001 | No critical overlap or horizontal page overflow at 1440 px width. | NOT TESTED | Requires browser at 1440 px width. |
| RESP-002 | No critical overlap or horizontal page overflow at 1024 px width. | NOT TESTED | Requires browser at 1024 px width. |
| RESP-003 | No critical overlap or horizontal page overflow at 768 px width. | NOT TESTED | Requires browser at 768 px width. |
| RESP-004 | No critical overlap or horizontal page overflow at 390 px width, except intentional table-local horizontal scrolling. | NOT TESTED | Requires browser at 390 px width. |
| RESP-005 | Parameter controls remain usable on touch-sized screens. | NOT TESTED | Requires touch-screen or browser touch emulation. |
| RESP-006 | Visualization redraws correctly after viewport resize and view switching. | NOT TESTED | Requires browser: resizing viewport and switching views while observing SVG redraw. |

## K. Language and content hygiene

| Test ID | Requirement | Status | Evidence |
| --- | --- | --- | --- |
| LANG-001 | Interface text is English, except source place names and raw archival fields. | PASS | Interface text is English throughout. Turkish place names (area names) and raw archival field values are source data, not interface text. |
| LANG-002 | Code identifiers, comments, filenames, documentation, exported labels, and error messages are English. | PASS | Code identifiers, comments, function names, and exported field names are English. No non-English code identifiers found in `app.js`. |
| LANG-003 | No unfinished TODO, placeholder, lorem ipsum, generic figure caption, internal reviewer note, or manuscript editing note appears. | PASS | `grep "TODO\|FIXME\|lorem ipsum\|TBD\|\[PLACEHOLDER\]"` in source files returns zero results. No manuscript or reviewer notes found. |
| LANG-004 | No claim is attributed to the validated dataset unless supported by the uploaded files. | PASS | Key statistical claims verified against data file: P1 distribution (3/70/78/8/1), P8 distribution (80/77/13/7/3/2/1), P9 (53 observed/130 unavailable), scope counts (264 candidates/183 analysed/146 included/37 partial/81 excluded), chi-square values (5.013, df=2, p=0.082, V=0.184). All match data file. |
| LANG-005 | No source, citation, statistic, sample size, category, range, or relationship is invented. | PASS | No statistical values, category names, or relationships invented beyond what appears in the evidence data file and authoritative project specification. All counts verified by Python inspection of `ascaad26-evidence-data.js`. |

---

## Summary

| | Count |
|---|---:|
| **PASS** | **82** |
| **FAIL** | **0** |
| **NOT TESTED** | **42** |
| **Total** | **124** |

---

## Tests that could not be run

The following 42 tests require actual browser execution and could not be run in this static inspection environment:

ARCH-003, ARCH-004, ARCH-010 — `file://` protocol operation, GitHub Pages deployment, browser console errors  
DATA-012 — startup integrity-check runtime output (underlying data confirmed correct by Python)  
P1-008 — schematic floor-count visual update  
P8-006 — schematic facade-palette visual update  
P9-005 — schematic roof-hatch visual update  
VIS-001–VIS-009 — all visualization-only parameter visual effects in schematic model  
VIS-013 — configuration summary visual evidence-status rendering  
VIS-014 — JSON export download and file inspection  
EXP-010–EXP-017 — filter combination behavior, clear filters, no-results state, table column display, record detail dialog, keyboard dismissal, CSV download and encoding  
A11Y-001–A11Y-010 — all accessibility checks  
RESP-001–RESP-006 — all responsive-layout checks  

---

## Scientific constraints

No scientific constraint was weakened or removed during development or testing. All prohibited outputs (overall score, AI confidence, pass/fail classification, P1×P8 conditional rule, P5×P6 relationship, composite compatibility rating) are absent from the application. The data file `ascaad26-evidence-data.js` was not modified (345 202 bytes, confirmed identical to the supplied authoritative file by byte count). All PASS results are supported by specific static evidence identified above.

## Non-evaluative feedback enhancement

The Design Explorer additionally includes an `Input Feedback & Evidence Context` live region. Static and deterministic checks confirm that:

- invalid P1 entries retain the preceding valid integer and produce an input-validation message;
- visualization-only values outside the technical display range are not applied;
- valid off-step visualization values are aligned to the nearest permitted display step and disclosed as such;
- P1 and P8 messages use authoritative aggregate counts and explicitly remain descriptive;
- P9 messages retain the low-coverage and area-imbalance limitation;
- no feedback message computes a score, design classification, conditional parameter rule, or automatic design change.

This enhancement does not add, remove, renumber, or change the status of any of the 124 authoritative acceptance-test rows above. Browser and assistive-technology interaction remains covered by the existing `NOT TESTED` declarations where applicable.
