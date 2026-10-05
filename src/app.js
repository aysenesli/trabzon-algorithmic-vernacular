'use strict';

/* ════════════════════════════════════════════════════════════════════════
   TRABZON VERNACULAR INVENTORY INTERFACE
   src/app.js · v1.2.0 · Documented Cases Build

   Authoritative source order:
     1. 02_SCIENTIFIC_PRODUCT_SPEC_EN.md
     2. ASCAAD26_Validated_Full_Dataset.xlsx
     3. ascaad26-evidence-data.js
     4. 03_ACCEPTANCE_TESTS_EN.md

   All data read from window.ASCAAD26_EVIDENCE_DATA via
   data/ascaad26-evidence-data.js (unmodified copy).

   No fetch(), XHR, WebSocket, external library, or network request.
   No overall score, compatibility rating, AI confidence, or design
   classification of any kind. No conditional link between parameters.
════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────
   SECTION 1 — CONSTANTS
───────────────────────────────────────────────────────────────────── */

/** P8 category keys in the required display order (from scientific spec).
 *  Do not rely on JS object insertion order for these. */
const P8_DISPLAY_ORDER = [
  'stone+timber+bagdadi',
  'stone/masonry',
  'stone+timber',
  'stone+brick',
  'stone+timber+brick',
  'timber',
  'briquette/masonry'
];

/** Human-readable labels for each P8 key. */
const P8_LABELS = {
  'stone+timber+bagdadi': 'Stone + Timber + Bagdadi',
  'stone/masonry':        'Stone / Masonry',
  'stone+timber':         'Stone + Timber',
  'stone+brick':          'Stone + Brick',
  'stone+timber+brick':   'Stone + Timber + Brick',
  'timber':               'Timber',
  'briquette/masonry':    'Briquette / Masonry'
};

/** P9 option definitions. Storage keys match p9_roof_material_limited field.
 *  Empty string maps to NA in aggregates.p9.counts. */
const P9_OPTIONS = [
  { key: '',                        label: 'Unknown / Unavailable' },
  { key: 'tile (type unspecified)', label: 'Tile (type unspecified)'    },
  { key: 'metal sheet/mixed repair',label: 'Metal sheet / Mixed repair'  }
];

/** Technical rendering starting values — not inventory-derived. */
const STARTING_VALUES = {
  P1:  3,
  P2:  9.5,
  P3:  8.0,
  P4:  0.20,
  P5:  38,
  P6:  0.90,
  P7:  3.00,
  P8:  'stone+timber+bagdadi',
  P9:  '',
  P10: 1.00,
  P11: 0.55,
  P12: 0.45
};

/** Technical rendering constraints only; none is an inventory-derived range. */
const PARAM_CONSTRAINTS = {
  P2:  { name: 'P2 — Building Width',       min: 5.0,  max: 16.0, step: 0.5,  decimals: 1, unit: 'm' },
  P3:  { name: 'P3 — Building Depth',       min: 5.0,  max: 16.0, step: 0.5,  decimals: 1, unit: 'm' },
  P4:  { name: 'P4 — Window-to-Wall Ratio', min: 0.05, max: 0.45, step: 0.01, decimals: 2, unit: '' },
  P5:  { name: 'P5 — Roof Slope',           min: 15,   max: 65,   step: 1,    decimals: 0, unit: '°' },
  P6:  { name: 'P6 — Eave Depth',           min: 0.20, max: 2.00, step: 0.05, decimals: 2, unit: 'm' },
  P7:  { name: 'P7 — Storey Height',        min: 2.20, max: 4.00, step: 0.10, decimals: 2, unit: 'm' },
  P10: { name: 'P10 — Balcony Depth',       min: 0.00, max: 2.00, step: 0.05, decimals: 2, unit: 'm' },
  P11: { name: 'P11 — Balcony Width Ratio', min: 0.10, max: 1.00, step: 0.05, decimals: 2, unit: '' },
  P12: { name: 'P12 — Wall Thickness',      min: 0.20, max: 0.85, step: 0.05, decimals: 2, unit: 'm' }
};

/** SVG fill colors per P8 material key. */
const P8_COLORS = {
  'stone+timber+bagdadi': '#c4a87a',
  'stone/masonry':        '#8f8f8f',
  'stone+timber':         '#a07850',
  'stone+brick':          '#b56050',
  'stone+timber+brick':   '#b07860',
  'timber':               '#7a4e28',
  'briquette/masonry':    '#b0b0b0'
};

/** SVG fill colors per P9 storage key. */
const P9_COLORS = {
  '':                          '#707070',
  'tile (type unspecified)':   '#b85040',
  'metal sheet/mixed repair':  '#50637a'
};

/** Hatch pattern IDs per material. */
const P8_PATTERN = {
  'stone+timber+bagdadi': 'pat-bagdadi',
  'stone/masonry':        'pat-masonry',
  'stone+timber':         'pat-stone-timber',
  'stone+brick':          'pat-brick',
  'stone+timber+brick':   'pat-stone-timber-brick',
  'timber':               'pat-timber',
  'briquette/masonry':    'pat-briquette'
};

const P9_PATTERN = {
  '':                          'pat-roof-unknown',
  'tile (type unspecified)':   'pat-roof-tile',
  'metal sheet/mixed repair':  'pat-roof-metal'
};

/* ─────────────────────────────────────────────────────────────────────
   SECTION 2 — APPLICATION STATE
───────────────────────────────────────────────────────────────────── */

let DB = null;   // bound to window.ASCAAD26_EVIDENCE_DATA after checks

const state = {
  params:         { ...STARTING_VALUES },
  filters: {
    text:         '',
    area:         '',
    inclusion:    '',
    p1:           '',
    p8:           '',
    p9:           '',
    construction: '',
    review:       ''
  },
  visibleRecords: [],
  activeView:     'design',   // 'design' | 'evidence' | 'method'
  schemView:      'elevation', // 'elevation' | 'plan'
  lastDetailTrigger: null     // element to return focus to after dialog close
};

let drawDebounce = null;
let filterDebounce = null;

/* ─────────────────────────────────────────────────────────────────────
   SECTION 3 — DATA INTEGRITY CHECKS
───────────────────────────────────────────────────────────────────── */

/**
 * Run all startup integrity checks. Returns { passed: bool, failures: [] }.
 * Checks are non-destructive cross-validations; they never override
 * the authoritative aggregate values.
 */
function runIntegrityChecks(cs, ar, rv, agg, val) {
  const failures = [];

  function check(label, expected, actual) {
    if (actual !== expected) {
      failures.push(`${label}: expected ${expected}, got ${actual}`);
    }
  }

  function checkTrue(label, expr) {
    if (!expr) failures.push(label);
  }

  // candidateScope counts
  check('candidateScope.length', 264, cs.length);
  check('candidateScope included',         146, cs.filter(r => r.inclusion_status === 'included').length);
  check('candidateScope partially included', 37, cs.filter(r => r.inclusion_status === 'partially included').length);
  check('candidateScope excluded',           81, cs.filter(r => r.inclusion_status === 'excluded').length);

  // analysisRecords counts
  check('analysisRecords.length', 183, ar.length);
  check('analysisRecords included',          146, ar.filter(r => r.inclusion_status === 'included').length);
  check('analysisRecords partially included', 37, ar.filter(r => r.inclusion_status === 'partially included').length);
  check('analysisRecords excluded (must be 0)', 0, ar.filter(r => r.inclusion_status === 'excluded').length);

  // researcherValidation
  check('researcherValidation.length', 30, rv.length);

  // P1 observable counts
  const p1Observable = ar.filter(r => Number.isInteger(r.p1_visible_floor_count));
  check('P1 observable count', 160, p1Observable.length);
  check('P1=1', 3,  p1Observable.filter(r => r.p1_visible_floor_count === 1).length);
  check('P1=2', 70, p1Observable.filter(r => r.p1_visible_floor_count === 2).length);
  check('P1=3', 78, p1Observable.filter(r => r.p1_visible_floor_count === 3).length);
  check('P1=4', 8,  p1Observable.filter(r => r.p1_visible_floor_count === 4).length);
  check('P1=5', 1,  p1Observable.filter(r => r.p1_visible_floor_count === 5).length);

  // P8 distribution
  check('P8 observed count', 183, ar.filter(r => r.p8_material_category).length);
  const p8Cats = new Set(ar.map(r => r.p8_material_category));
  check('P8 unique categories', 7, p8Cats.size);
  const p8CountsExpected = { 'stone+timber+bagdadi': 80, 'stone/masonry': 77, 'stone+timber': 13, 'stone+brick': 7, 'stone+timber+brick': 3, 'timber': 2, 'briquette/masonry': 1 };
  for (const [key, expected] of Object.entries(p8CountsExpected)) {
    check(`P8 "${key}" count`, expected, ar.filter(r => r.p8_material_category === key).length);
  }

  // P9 observable count (p9_roof_material_limited is '' or null when not observable)
  const p9Observable = ar.filter(r => !(r.p9_roof_material_limited == null || r.p9_roof_material_limited === ''));
  check('P9 observable count', 53, p9Observable.length);
  check('P9 unavailable count (empty string)', 130, ar.filter(r => (r.p9_roof_material_limited == null || r.p9_roof_material_limited === '')).length);

  // Review status counts
  check('researcher validated rows', 30, ar.filter(r => r.review_status === 'researcher validated').length);
  check('researcher review required rows', 153, ar.filter(r => r.review_status === 'researcher review required').length);

  // validation fields
  check('validation.researcherValidatedRowsInFullDataset', 30, val.researcherValidatedRowsInFullDataset);
  check('validation.remainingRowsRequiringResearcherReview', 153, val.remainingRowsRequiringResearcherReview);

  // Unique record IDs
  const ids = ar.map(r => r.record_id);
  checkTrue('analysisRecords record_id uniqueness', new Set(ids).size === ids.length);

  return { passed: failures.length === 0, failures };
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 4 — SVG PATTERN DEFS
───────────────────────────────────────────────────────────────────── */

/** Generate SVG <defs> containing all material patterns. */
function buildSvgDefs() {
  // Helper: thin horizontal line pattern
  const hLines = (id, bg, stroke, spacing = 6) =>
    `<pattern id="${id}" x="0" y="0" width="12" height="${spacing}" patternUnits="userSpaceOnUse">
       <rect width="12" height="${spacing}" fill="${bg}"/>
       <line x1="0" y1="${spacing - 1}" x2="12" y2="${spacing - 1}" stroke="${stroke}" stroke-width="0.5" opacity="0.5"/>
     </pattern>`;

  // Helper: diagonal hatch
  const diagLines = (id, bg, stroke) =>
    `<pattern id="${id}" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
       <rect width="8" height="8" fill="${bg}"/>
       <line x1="0" y1="8" x2="8" y2="0" stroke="${stroke}" stroke-width="0.6" opacity="0.45"/>
       <line x1="-2" y1="8" x2="2" y2="0" stroke="${stroke}" stroke-width="0.6" opacity="0.45"/>
       <line x1="6" y1="8" x2="10" y2="0" stroke="${stroke}" stroke-width="0.6" opacity="0.45"/>
     </pattern>`;

  // Helper: cross hatch
  const crossHatch = (id, bg, stroke) =>
    `<pattern id="${id}" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
       <rect width="8" height="8" fill="${bg}"/>
       <line x1="0" y1="4" x2="8" y2="4" stroke="${stroke}" stroke-width="0.5" opacity="0.35"/>
       <line x1="4" y1="0" x2="4" y2="8" stroke="${stroke}" stroke-width="0.5" opacity="0.35"/>
     </pattern>`;

  // Helper: vertical wood grain
  const woodGrain = (id, bg, stroke) =>
    `<pattern id="${id}" x="0" y="0" width="6" height="12" patternUnits="userSpaceOnUse">
       <rect width="6" height="12" fill="${bg}"/>
       <line x1="3" y1="0" x2="3" y2="12" stroke="${stroke}" stroke-width="0.6" opacity="0.5"/>
     </pattern>`;

  // Helper: scale pattern for tiles
  const scalePat = (id, bg, stroke) =>
    `<pattern id="${id}" x="0" y="0" width="12" height="8" patternUnits="userSpaceOnUse">
       <rect width="12" height="8" fill="${bg}"/>
       <ellipse cx="6" cy="8" rx="6" ry="4" fill="none" stroke="${stroke}" stroke-width="0.6" opacity="0.5"/>
       <ellipse cx="12" cy="8" rx="6" ry="4" fill="none" stroke="${stroke}" stroke-width="0.6" opacity="0.5"/>
       <ellipse cx="0" cy="8" rx="6" ry="4" fill="none" stroke="${stroke}" stroke-width="0.6" opacity="0.5"/>
     </pattern>`;

  return [
    diagLines('pat-bagdadi',          '#c4a87a', '#8a6a40'),
    hLines(   'pat-masonry',          '#8f8f8f', '#5a5a5a'),
    crossHatch('pat-stone-timber',    '#a07850', '#70502a'),
    hLines(   'pat-brick',            '#b56050', '#7a3520', 5),
    diagLines('pat-stone-timber-brick','#b07860','#703838'),
    woodGrain('pat-timber',           '#7a4e28', '#3a2010'),
    hLines(   'pat-briquette',        '#b0b0b0', '#808080'),
    // Roof patterns
    `<pattern id="pat-roof-unknown" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
       <rect width="8" height="8" fill="#606060"/>
       <line x1="0" y1="4" x2="8" y2="4" stroke="#404040" stroke-width="0.5" opacity="0.4"/>
     </pattern>`,
    scalePat('pat-roof-tile',  '#b85040', '#7a3020'),
    hLines(  'pat-roof-metal', '#50637a', '#303d50', 4)
  ].join('\n');
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 5 — SVG ELEVATION RENDERER
───────────────────────────────────────────────────────────────────── */

function renderElevation(params) {
  const { P1, P2, P4, P5, P6, P7, P8, P9, P10, P11 } = params;

  const VW = 600, VH = 520;
  const CX = 300;
  const GROUND_Y = 490;
  const MARGIN_TOP = 30;

  // Geometry in metres
  const eaveHalfW_m  = P2 / 2 + P6;
  const roofH_m      = eaveHalfW_m * Math.tan(P5 * Math.PI / 180);
  const facadeH_m    = P1 * P7;
  const totalH_m     = facadeH_m + roofH_m;
  const totalW_m     = 2 * eaveHalfW_m;

  // Compute scale to fit viewBox
  const availH = GROUND_Y - MARGIN_TOP;
  const availW = VW - 40;
  const hScale = availH / totalH_m;
  const wScale = availW / totalW_m;
  const scale  = Math.min(hScale, wScale);

  // Pixel coordinates
  const facadeW   = P2 * scale;
  const storeyH   = P7 * scale;
  const facadeH   = P1 * storeyH;
  const eaveHalfW = eaveHalfW_m * scale;
  const roofH_px  = roofH_m * scale;

  const wallL   = CX - facadeW / 2;
  const wallR   = CX + facadeW / 2;
  const eaveL   = CX - eaveHalfW;
  const eaveR   = CX + eaveHalfW;
  const facadeT = GROUND_Y - facadeH;
  const apexY   = facadeT - roofH_px;

  const p8Pat  = P8_PATTERN[P8]  || 'pat-masonry';
  const p9Pat  = P9_PATTERN[P9]  || 'pat-roof-unknown';
  const wallBorder = '#1a1a1a';

  let g = '';

  // Ground shadow
  g += `<ellipse cx="${CX}" cy="${GROUND_Y + 4}" rx="${facadeW * 0.6}" ry="5" fill="rgba(0,0,0,0.3)"/>`;

  // Ground line
  g += `<line x1="${eaveL - 10}" y1="${GROUND_Y}" x2="${eaveR + 10}" y2="${GROUND_Y}" stroke="#3a3a3a" stroke-width="2"/>`;

  // Facade fill
  g += `<rect x="${wallL}" y="${facadeT}" width="${facadeW}" height="${facadeH}"
             fill="url(#${p8Pat})" stroke="${wallBorder}" stroke-width="1.2"/>`;

  // Floor division lines
  for (let fl = 1; fl < P1; fl++) {
    const lineY = GROUND_Y - fl * storeyH;
    g += `<line x1="${wallL}" y1="${lineY}" x2="${wallR}" y2="${lineY}"
               stroke="${wallBorder}" stroke-width="0.8" opacity="0.6"/>`;
  }

  // Windows per floor
  for (let fl = 0; fl < P1; fl++) {
    const floorB = GROUND_Y - fl * storeyH;
    const floorT = floorB - storeyH;
    g += renderFloorWindows(wallL, wallR, floorT, floorB, P4);
  }

  // Roof polygon
  const roofPts = `${eaveL},${facadeT} ${CX},${apexY} ${eaveR},${facadeT}`;
  g += `<polygon points="${roofPts}" fill="url(#${p9Pat})" stroke="${wallBorder}" stroke-width="1.2"/>`;

  // Eave soffit lines (horizontal extensions beyond walls)
  if (P6 > 0.05) {
    const eaveY = facadeT;
    g += `<line x1="${eaveL}" y1="${eaveY}" x2="${wallL}" y2="${eaveY}"
               stroke="#404040" stroke-width="2.5"/>`;
    g += `<line x1="${wallR}" y1="${eaveY}" x2="${eaveR}" y2="${eaveY}"
               stroke="#404040" stroke-width="2.5"/>`;
  }

  // Balcony (only if P10 > 0.001)
  if (P10 > 0.001) {
    const balcW = P11 * facadeW;
    const balcL = CX - balcW / 2;
    const balcR = CX + balcW / 2;
    const balcFloorIdx = Math.max(0, P1 - 2);
    const balcBaseY = GROUND_Y - balcFloorIdx * storeyH;
    const balcTopY = balcBaseY - storeyH;
    const projDepth = P10 * scale;  // projection depth in px
    const slabH = Math.max(6, Math.min(projDepth * 0.6, storeyH * 0.25));

    // Balcony slab (show projection as depth indicator below slab)
    g += `<rect x="${balcL}" y="${balcTopY}" width="${balcW}" height="${slabH}" fill="#b0a080" stroke="${wallBorder}" stroke-width="0.8"/>`;

    // Projection depth line (schematic indicator on right side)
    const projX = balcR + 6;
    g += `<line x1="${projX}" y1="${balcTopY}" x2="${projX}" y2="${balcTopY + slabH}" stroke="#6a8aaa" stroke-width="1.5"/>`;
    g += `<text x="${projX + 4}" y="${balcTopY + slabH / 2 + 3}" font-size="8" fill="#6a8aaa" font-family="system-ui">↕${P10}m</text>`;

    // Railing
    const railH = Math.max(2, storeyH * 0.08);
    g += `<rect x="${balcL}" y="${balcTopY + slabH}" width="${balcW}" height="${railH}" fill="#808080" stroke="${wallBorder}" stroke-width="0.6"/>`;

    // Balusters
    const numBalusters = Math.max(2, Math.round(balcW / 10));
    const bSpacing = balcW / numBalusters;
    for (let b = 0; b <= numBalusters; b++) {
      const bx = balcL + b * bSpacing;
      g += `<line x1="${bx}" y1="${balcTopY + slabH}" x2="${bx}" y2="${balcTopY + slabH + railH}" stroke="#606060" stroke-width="0.8" opacity="0.6"/>`;
    }
  }

  // Ridge point indicator
  g += `<circle cx="${CX}" cy="${apexY}" r="2" fill="#606060"/>`;

  // Floor count label
  g += `<text x="${wallL - 6}" y="${facadeT + 4}" text-anchor="end"
             font-size="10" fill="#5a6a7a" font-family="system-ui">${P1} fl.</text>`;

  return g;
}

/**
 * Render windows on one floor.
 * @param {number} left  - left edge of facade in px
 * @param {number} right - right edge of facade in px
 * @param {number} top   - top of floor band in px
 * @param {number} bot   - bottom of floor band in px
 * @param {number} P4    - window-to-wall ratio (0.05–0.45)
 */
function renderFloorWindows(left, right, top, bot, P4) {
  const floorW  = right - left;
  const floorH  = bot - top;
  const padding = Math.max(4, floorW * 0.06);

  // Number of windows: ~1 per 28px of width
  const nWin = Math.max(1, Math.round(floorW / 28));

  // Total window width from P4 (area fraction applied to width, height ~60% of floor)
  const winH    = floorH * Math.min(0.60, P4 * 1.5);
  const totalWW = floorW * P4 * (nWin > 1 ? 0.85 : 0.70);
  const winW    = Math.max(4, totalWW / nWin);

  // Vertical centre of window in floor band
  const winY = top + (floorH - winH) * 0.45;

  // Spacing
  const usable  = floorW - 2 * padding;
  const spacing = nWin > 1 ? (usable - nWin * winW) / (nWin - 1) : 0;
  const startX  = left + padding + (nWin === 1 ? (usable - winW) / 2 : 0);

  let g = '';
  for (let i = 0; i < nWin; i++) {
    const wx = startX + i * (winW + spacing);
    g += `<rect x="${wx.toFixed(1)}" y="${winY.toFixed(1)}"
               width="${winW.toFixed(1)}" height="${winH.toFixed(1)}"
               fill="#1e2d3a" stroke="#304050" stroke-width="0.8"/>`;
    // Glazing bar (cross)
    const midX = wx + winW / 2;
    const midY = winY + winH / 2;
    g += `<line x1="${wx.toFixed(1)}" y1="${midY.toFixed(1)}" x2="${(wx+winW).toFixed(1)}" y2="${midY.toFixed(1)}"
               stroke="#304050" stroke-width="0.5" opacity="0.8"/>`;
    g += `<line x1="${midX.toFixed(1)}" y1="${winY.toFixed(1)}" x2="${midX.toFixed(1)}" y2="${(winY+winH).toFixed(1)}"
               stroke="#304050" stroke-width="0.5" opacity="0.8"/>`;
  }
  return g;
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 6 — SVG PLAN / ROOF RENDERER
───────────────────────────────────────────────────────────────────── */

function renderPlan(params) {
  const { P2, P3, P5, P6, P12 } = params;

  const VW = 600, VH = 400;
  const CX = 300, CY = 205;

  // Scale to fit
  const availW = VW - 60;
  const availH = VH - 60;
  const wScale = availW / (P2 + 2 * P6 + 0.5);
  const hScale = availH / (P3 + 2 * P6 + 0.5);
  const scale  = Math.min(wScale, hScale);

  // Outer footprint (including eaves in plan)
  const outerW = (P2 + 2 * P6) * scale;
  const outerH = (P3 + 2 * P6) * scale;
  const outerL = CX - outerW / 2;
  const outerT = CY - outerH / 2;

  // Wall outer face
  const wallW  = P2 * scale;
  const wallD  = P3 * scale;
  const wallL  = CX - wallW / 2;
  const wallR  = wallL + wallW;
  const wallT  = CY - wallD / 2;

  // Inner face (wall thickness removes from each side)
  const thickPx = P12 * scale;
  const innerW  = Math.max(4, wallW - 2 * thickPx);
  const innerH  = Math.max(4, wallD - 2 * thickPx);
  const innerL  = wallL + thickPx;
  const innerT  = wallT + thickPx;

  let g = '';

  // Eave overhang outline (dashed)
  g += `<rect x="${outerL}" y="${outerT}" width="${outerW}" height="${outerH}"
             fill="none" stroke="#3a4a5a" stroke-width="1" stroke-dasharray="4 3"/>`;

  // Wall (exterior fill)
  g += `<rect x="${wallL}" y="${wallT}" width="${wallW}" height="${wallD}"
             fill="#4a4030" stroke="#2a2a2a" stroke-width="1.5"/>`;

  // Interior void
  g += `<rect x="${innerL}" y="${innerT}" width="${innerW}" height="${innerH}"
             fill="#1a1f26" stroke="#303844" stroke-width="0.8"/>`;

  // Wall thickness dimension indicator
  if (thickPx > 4) {
    const tx1 = wallL;
    const tx2 = innerL;
    const ty  = wallT + wallD + 8;
    g += `<line x1="${tx1}" y1="${ty}" x2="${tx2}" y2="${ty}" stroke="#4a6a8a" stroke-width="1.2"/>`;
    g += `<line x1="${tx1}" y1="${ty - 3}" x2="${tx1}" y2="${ty + 3}" stroke="#4a6a8a" stroke-width="1.2"/>`;
    g += `<line x1="${tx2}" y1="${ty - 3}" x2="${tx2}" y2="${ty + 3}" stroke="#4a6a8a" stroke-width="1.2"/>`;
    g += `<text x="${(tx1+tx2)/2}" y="${ty + 12}" text-anchor="middle"
               font-size="9" fill="#4a6a8a" font-family="system-ui">t=${P12}m</text>`;
  }

  // Roof ridge (along longest dimension)
  // Ridge runs parallel to the longer wall axis
  const ridgeIsHoriz = P2 >= P3;
  const ridgeOffsetFrac = 0.0; // ridge at center

  if (ridgeIsHoriz) {
    const ry = CY + ridgeOffsetFrac * wallD;
    g += `<line x1="${wallL + wallW * 0.05}" y1="${ry}" x2="${wallL + wallW * 0.95}" y2="${ry}"
               stroke="#6a8aaa" stroke-width="2" stroke-linecap="round"/>`;
    // Slope arrows from ridge to eave edges
    const arrowY1 = outerT;
    const arrowY2 = outerT + outerH;
    g += `<line x1="${CX}" y1="${ry}" x2="${CX}" y2="${arrowY1}" stroke="#4a6a8a" stroke-width="1" stroke-dasharray="3 2"/>`;
    g += `<line x1="${CX}" y1="${ry}" x2="${CX}" y2="${arrowY2}" stroke="#4a6a8a" stroke-width="1" stroke-dasharray="3 2"/>`;
  } else {
    const rx = CX + ridgeOffsetFrac * wallW;
    g += `<line x1="${rx}" y1="${wallT + wallD * 0.05}" x2="${rx}" y2="${wallT + wallD * 0.95}"
               stroke="#6a8aaa" stroke-width="2" stroke-linecap="round"/>`;
    const arrowX1 = outerL;
    const arrowX2 = outerL + outerW;
    g += `<line x1="${rx}" y1="${CY}" x2="${arrowX1}" y2="${CY}" stroke="#4a6a8a" stroke-width="1" stroke-dasharray="3 2"/>`;
    g += `<line x1="${rx}" y1="${CY}" x2="${arrowX2}" y2="${CY}" stroke="#4a6a8a" stroke-width="1" stroke-dasharray="3 2"/>`;
  }

  // Dimension labels
  const dimY = outerT - 12;
  g += `<line x1="${wallL}" y1="${dimY}" x2="${wallR}" y2="${dimY}" stroke="#4a6a8a" stroke-width="1"/>`;
  g += `<line x1="${wallL}" y1="${dimY-4}" x2="${wallL}" y2="${dimY+4}" stroke="#4a6a8a" stroke-width="1"/>`;
  g += `<line x1="${wallR}" y1="${dimY-4}" x2="${wallR}" y2="${dimY+4}" stroke="#4a6a8a" stroke-width="1"/>`;
  g += `<text x="${CX}" y="${dimY - 4}" text-anchor="middle" font-size="10" fill="#4a6a8a" font-family="system-ui">W=${P2}m</text>`;

  const dimX = wallL - 12;
  const wallB = wallT + wallD;
  g += `<line x1="${dimX}" y1="${wallT}" x2="${dimX}" y2="${wallB}" stroke="#4a6a8a" stroke-width="1"/>`;
  g += `<line x1="${dimX-4}" y1="${wallT}" x2="${dimX+4}" y2="${wallT}" stroke="#4a6a8a" stroke-width="1"/>`;
  g += `<line x1="${dimX-4}" y1="${wallB}" x2="${dimX+4}" y2="${wallB}" stroke="#4a6a8a" stroke-width="1"/>`;
  g += `<text x="${dimX - 6}" y="${CY}" text-anchor="middle" font-size="10" fill="#4a6a8a" font-family="system-ui"
             transform="rotate(-90 ${dimX-6} ${CY})">D=${P3}m</text>`;

  // Slope label
  g += `<text x="${CX}" y="${outerT + outerH + 22}" text-anchor="middle"
             font-size="10" fill="#5a7a9a" font-family="system-ui">Slope ${P5}° — Ridge shown centre</text>`;

  // North indicator (schematic)
  g += `<text x="${outerL + outerW + 8}" y="${outerT + 12}"
             font-size="12" fill="#4a6a8a" font-family="system-ui" font-weight="bold">N</text>`;

  return g;
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 7 — SCHEMATIC SVG UPDATE
───────────────────────────────────────────────────────────────────── */

function updateSchematic() {
  const { schemView, params } = state;

  if (schemView === 'elevation') {
    const defsEl = document.getElementById('elev-defs');
    const gEl    = document.getElementById('elev-g');
    if (defsEl) defsEl.innerHTML = buildSvgDefs();
    if (gEl)    gEl.innerHTML    = renderElevation(params);
  } else {
    const defsEl = document.getElementById('plan-defs');
    const gEl    = document.getElementById('plan-g');
    if (defsEl) defsEl.innerHTML = buildSvgDefs();
    if (gEl)    gEl.innerHTML    = renderPlan(params);
  }
}

function scheduleSchematicUpdate() {
  clearTimeout(drawDebounce);
  drawDebounce = setTimeout(updateSchematic, 80);
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 8 — EVIDENCE TRACES
───────────────────────────────────────────────────────────────────── */

function updateP1Trace() {
  const p1 = state.params.P1;
  const agg = DB.aggregates.p1;

  // Counts come from authoritative aggregate object
  const observed    = agg.observed;   // 160
  const total       = agg.total;      // 183
  const unavailable = agg.counts['NA']; // 23

  const selectedCount = agg.counts[String(p1)] || 0;
  const selectedPct   = ((selectedCount / observed) * 100).toFixed(1);

  // Build left column trace
  const leftEl = document.getElementById('p1-trace-container');
  if (leftEl) {
    let html = `<div class="trace-obs">Observed: ${observed}/${total} (${(agg.observability * 100).toFixed(1)}%) · ${unavailable} unavailable</div>`;
    html += `<div class="trace-obs">Reports frequency — not suitability</div>`;
    html += `<div class="trace-row trace-row--selected">
               <span class="trace-key">P1 = ${p1}</span>
               <span class="trace-selected-highlight">${selectedCount}/${observed} &nbsp; ${selectedPct}%</span>
             </div>`;
    html += `<div class="trace-obs" style="margin-top:6px;border-top:1px solid var(--border);padding-top:4px">Full distribution (N=160):</div>`;
    for (const v of [1,2,3,4,5]) {
      const c = agg.counts[String(v)] || 0;
      const pct = ((c / observed) * 100).toFixed(1);
      const isSelected = v === p1;
      html += `<div class="trace-row${isSelected ? ' trace-row--selected' : ''}">
                 <span class="trace-key">P1=${v}</span>
                 <span class="trace-value">${c} &nbsp; (${pct}%)</span>
               </div>`;
    }
    leftEl.innerHTML = html;
  }

  // Build right column trace
  const rightEl = document.getElementById('p1-right-trace-body');
  if (rightEl) {
    rightEl.innerHTML = `
      <div class="trace-row"><span class="trace-key">Selected</span><span class="trace-selected-highlight">P1 = ${p1}</span></div>
      <div class="trace-row"><span class="trace-key">Count</span><span class="trace-value">${selectedCount} / ${observed}</span></div>
      <div class="trace-row"><span class="trace-key">Frequency</span><span class="trace-value">${selectedPct}%</span></div>
      <div class="trace-row"><span class="trace-key">Observability</span><span class="trace-value">${observed}/${total} (${(agg.observability*100).toFixed(1)}%)</span></div>
      <div class="trace-row" style="font-size:0.70rem;color:var(--t-2);margin-top:4px">N = ${observed} (denominator)</div>`;
  }
}

function updateP8Trace() {
  const p8 = state.params.P8;
  const agg = DB.aggregates.p8;

  const observed  = agg.observed;  // 183
  const total     = agg.total;     // 183

  const selectedCount = agg.counts[p8] || 0;
  const selectedPct   = ((selectedCount / observed) * 100).toFixed(1);
  const p8Label       = P8_LABELS[p8] || p8;

  // Left column trace
  const leftEl = document.getElementById('p8-trace-container');
  if (leftEl) {
    let html = `<div class="trace-obs">Observed: ${observed}/${total} (100%) · categorical frequency — not a score</div>`;
    html += `<div class="trace-row trace-row--selected">
               <span class="trace-key">${p8Label}</span>
               <span class="trace-selected-highlight">${selectedCount}/${observed} &nbsp; ${selectedPct}%</span>
             </div>`;
    html += `<div class="trace-obs" style="margin-top:6px;border-top:1px solid var(--border);padding-top:4px">All categories (N=183):</div>`;
    for (const key of P8_DISPLAY_ORDER) {
      const c   = agg.counts[key] || 0;
      const pct = ((c / observed) * 100).toFixed(1);
      const isSel = key === p8;
      html += `<div class="trace-row${isSel ? ' trace-row--selected' : ''}">
                 <span class="trace-key">${P8_LABELS[key]}</span>
                 <span class="trace-value">${c} &nbsp; (${pct}%)</span>
               </div>`;
    }
    leftEl.innerHTML = html;
  }

  // Right column trace
  const rightEl = document.getElementById('p8-right-trace-body');
  if (rightEl) {
    rightEl.innerHTML = `
      <div class="trace-row"><span class="trace-key">Selected</span><span class="trace-selected-highlight">${p8Label}</span></div>
      <div class="trace-row"><span class="trace-key">Count</span><span class="trace-value">${selectedCount} / ${observed}</span></div>
      <div class="trace-row"><span class="trace-key">Frequency</span><span class="trace-value">${selectedPct}%</span></div>
      <div class="trace-row"><span class="trace-key">Observability</span><span class="trace-value">${observed}/${total} (100%)</span></div>
      <div class="trace-row" style="font-size:0.70rem;color:var(--t-2);margin-top:4px">N = ${observed} (denominator)</div>`;
  }
}

function populateP9Trace() {
  const agg = DB.aggregates.p9;
  const el  = document.getElementById('p9-right-trace-body');
  if (!el) return;
  el.innerHTML = `
    <div class="trace-row"><span class="trace-key">Observed</span><span class="trace-value">${agg.observed} / ${agg.total}</span></div>
    <div class="trace-row"><span class="trace-key">Observability</span><span class="trace-value">${(agg.observability*100).toFixed(1)}%</span></div>
    <div class="trace-row"><span class="trace-key">Unavailable</span><span class="trace-value">${agg.counts['NA']}</span></div>
    <div style="font-size:0.70rem;color:var(--c-limited);margin-top:6px;line-height:1.4">
      ▲ Coverage is uneven across areas. These 53 records must not be generalised.
    </div>`;
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 9 — CONFIGURATION SUMMARY
───────────────────────────────────────────────────────────────────── */

function updateConfigSummary() {
  const p = state.params;
  const el = document.getElementById('config-summary');
  if (!el) return;

  const rows = [
    { key: 'P1 Floor count',        val: p.P1,           cls: 'descriptive' },
    { key: 'P2 Building width',      val: `${p.P2} m`,    cls: 'vis' },
    { key: 'P3 Building depth',      val: `${p.P3} m`,    cls: 'vis' },
    { key: 'P4 Window-to-wall ratio',val: p.P4,           cls: 'vis' },
    { key: 'P5 Roof slope',          val: `${p.P5}°`,     cls: 'vis' },
    { key: 'P6 Eave depth',          val: `${p.P6} m`,    cls: 'vis' },
    { key: 'P7 Storey height',       val: `${p.P7} m`,    cls: 'vis' },
    { key: 'P8 Facade category',     val: P8_LABELS[p.P8] || p.P8, cls: 'descriptive' },
    { key: 'P9 Roof material',       val: p.P9 === '' ? 'Unknown / Unavailable' : p.P9, cls: 'limited' },
    { key: 'P10 Balcony depth',      val: `${p.P10} m`,   cls: 'vis' },
    { key: 'P11 Balcony width ratio',val: p.P11,          cls: 'vis' },
    { key: 'P12 Wall thickness',     val: `${p.P12} m`,   cls: 'vis' }
  ];

  el.innerHTML = rows.map(r => `
    <div class="config-row">
      <span class="config-key">${r.key}</span>
      <span class="config-val">${r.val}</span>
    </div>`).join('');
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 10 — JSON EXPORT
───────────────────────────────────────────────────────────────────── */

function exportJSON() {
  const p     = state.params;
  const aggP1 = DB.aggregates.p1;
  const aggP8 = DB.aggregates.p8;
  const aggP9 = DB.aggregates.p9;
  const rel   = DB.aggregates.p1P8RelationshipTest;
  const meta  = DB.metadata;

  const p1Count = aggP1.counts[String(p.P1)] || 0;
  const p8Count = aggP8.counts[p.P8] || 0;

  const exportObj = {
    exportedAt: new Date().toISOString(),
    project: meta.project,
    evidenceStatus: {
      P1:  "descriptive evidence",
      P2:  "visualization-only input",
      P3:  "visualization-only input",
      P4:  "visualization-only input",
      P5:  "visualization-only input",
      P6:  "visualization-only input",
      P7:  "visualization-only input",
      P8:  "descriptive evidence",
      P9:  "limited record-level evidence",
      P10: "visualization-only input",
      P11: "visualization-only input",
      P12: "visualization-only input"
    },
    exportFormat: 'trabzon-schematic-configuration',
    sourceDatasetVersion: meta.datasetVersion,
    interfaceTitle: meta.interfaceTitle,
    parameters: {
      P1:  { value: p.P1,  name: 'Visible floor count',              evidenceClass: 'descriptive',     startingValue: STARTING_VALUES.P1 },
      P2:  { value: p.P2,  name: 'Building width (m)',               evidenceClass: 'visualization-only', startingValue: STARTING_VALUES.P2 },
      P3:  { value: p.P3,  name: 'Building depth (m)',               evidenceClass: 'visualization-only', startingValue: STARTING_VALUES.P3 },
      P4:  { value: p.P4,  name: 'Window-to-wall ratio',             evidenceClass: 'visualization-only', startingValue: STARTING_VALUES.P4 },
      P5:  { value: p.P5,  name: 'Roof slope (degrees)',             evidenceClass: 'visualization-only', startingValue: STARTING_VALUES.P5 },
      P6:  { value: p.P6,  name: 'Eave depth (m)',                   evidenceClass: 'visualization-only', startingValue: STARTING_VALUES.P6 },
      P7:  { value: p.P7,  name: 'Storey height (m)',                evidenceClass: 'visualization-only', startingValue: STARTING_VALUES.P7 },
      P8:  { value: p.P8,  name: 'Facade/construction material category', evidenceClass: 'descriptive', startingValue: STARTING_VALUES.P8 },
      P9:  { value: p.P9 === '' ? 'unknown/unavailable' : p.P9, name: 'Roof material', evidenceClass: 'limited-record-level', startingValue: 'unknown/unavailable' },
      P10: { value: p.P10, name: 'Balcony depth (m)',                evidenceClass: 'visualization-only', startingValue: STARTING_VALUES.P10 },
      P11: { value: p.P11, name: 'Balcony width ratio',              evidenceClass: 'visualization-only', startingValue: STARTING_VALUES.P11 },
      P12: { value: p.P12, name: 'Wall thickness (m)',               evidenceClass: 'visualization-only', startingValue: STARTING_VALUES.P12 }
    },
    p1EvidenceTrace: {
      selectedValue: p.P1,
      count: p1Count,
      denominator: aggP1.observed,
      percentage: ((p1Count / aggP1.observed) * 100).toFixed(2),
      observability: aggP1.observed + '/' + aggP1.total,
      unavailable: aggP1.counts['NA'],
      note: 'Frequency of observed floor counts in 183 analysis records. Not a suitability rating.'
    },
    p8EvidenceTrace: {
      selectedCategory: p.P8,
      selectedLabel: P8_LABELS[p.P8],
      count: p8Count,
      denominator: aggP8.observed,
      percentage: ((p8Count / aggP8.observed) * 100).toFixed(2),
      observability: aggP8.observed + '/' + aggP8.total,
      note: 'Categorical frequency in 183 analysis records. Not a score or recommendation.'
    },
    p9Limitation: {
      observed: aggP9.observed,
      total: aggP9.total,
      observability: (aggP9.observability * 100).toFixed(1) + '%',
      unavailable: aggP9.counts['NA'],
      warning: 'Coverage is low and area-imbalanced. These 53 records must not be generalised to the full population.'
    },
    rejectedRelationship: {
      test: 'P1 x P8 chi-square',
      n: rel.n,
      chiSquare: rel.chiSquare,
      degreesOfFreedom: rel.degreesOfFreedom,
      pValue: rel.pValue,
      cramersV: rel.cramersV,
      decision: rel.decision
    },
    interpretationBoundary: 'This interface reports descriptive inventory evidence and visualization inputs. It does not evaluate architectural correctness, compatibility, authenticity, or design quality. Visualization-only parameters (P2–P7, P10–P12) have no validated building-level inventory measurement. No score, confidence value, design classification, or automatic recommendation exists or is implied.'
  };

  const dateStr = new Date().toISOString().slice(0, 10);
  const blob    = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `trabzon-schematic-configuration-${dateStr}.json`);
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 11 — SCOPE SUMMARY
───────────────────────────────────────────────────────────────────── */

function buildScopeGrid() {
  const meta = DB.metadata;
  const el   = document.getElementById('scope-grid');
  if (!el) return;

  const items = [
    { value: meta.inventoryCodes,             label: 'Inventory codes' },
    { value: meta.independentCandidateRecords, label: 'Candidate records' },
    { value: meta.analysisRecords,            label: 'Analysis records' },
    { value: meta.includedRecords,            label: 'Included' },
    { value: meta.partiallyIncludedRecords,   label: 'Partially included' },
    { value: meta.excludedRecords,            label: 'Excluded' }
  ];

  el.innerHTML = items.map(item => `
    <div class="scope-item">
      <span class="scope-item__value">${item.value}</span>
      <span class="scope-item__label">${item.label}</span>
    </div>`).join('');
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 12 — DESIGN EXPLORER CONTROL SETUP
───────────────────────────────────────────────────────────────────── */

function buildP8Select() {
  const sel = document.getElementById('p8-select');
  if (!sel) return;
  sel.innerHTML = P8_DISPLAY_ORDER.map(key =>
    `<option value="${key}">${P8_LABELS[key]}</option>`
  ).join('');
  sel.value = state.params.P8;
}

function buildP8FilterOptions() {
  const sel = document.getElementById('filter-p8');
  if (!sel) return;
  P8_DISPLAY_ORDER.forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = P8_LABELS[key];
    sel.appendChild(opt);
  });
}

function buildAreaFilterOptions() {
  const sel = document.getElementById('filter-area');
  if (!sel) return;
  const areas = [...new Set(DB.analysisRecords.map(r => r.area))].sort();
  areas.forEach(area => {
    const opt = document.createElement('option');
    opt.value = area;
    opt.textContent = area;
    sel.appendChild(opt);
  });
}

function formatTechnicalNumber(key, value) {
  const constraint = PARAM_CONSTRAINTS[key];
  return Number(value).toFixed(constraint.decimals);
}

function formatTechnicalValue(key, value) {
  const constraint = PARAM_CONSTRAINTS[key];
  const number = formatTechnicalNumber(key, value);
  if (!constraint.unit) return number;
  return constraint.unit === '°' ? `${number}°` : `${number} ${constraint.unit}`;
}

function snapTechnicalValue(key, value) {
  const constraint = PARAM_CONSTRAINTS[key];
  const steps = Math.round((value - constraint.min) / constraint.step);
  const snapped = constraint.min + steps * constraint.step;
  return Number(snapped.toFixed(constraint.decimals));
}

function technicalRangeText(key) {
  const constraint = PARAM_CONSTRAINTS[key];
  return `${formatTechnicalValue(key, constraint.min)} to ${formatTechnicalValue(key, constraint.max)}, in ${formatTechnicalValue(key, constraint.step)} increments`;
}

function setInputFeedback(feedback) {
  const panel = document.getElementById('input-feedback');
  const label = document.getElementById('input-feedback-label');
  const message = document.getElementById('input-feedback-message');
  if (!panel || !label || !message) return;
  panel.dataset.kind = feedback.kind;
  label.textContent = feedback.label;
  message.textContent = feedback.message;
}

function buildP1Feedback(p1) {
  const aggregate = DB.aggregates.p1;
  const count = aggregate.counts[String(p1)] || 0;
  const percentage = (count / aggregate.observed * 100).toFixed(1);
  const mostFrequent = [1, 2, 3, 4, 5].reduce((best, value) =>
    aggregate.counts[String(value)] > aggregate.counts[String(best)] ? value : best, 1);
  const mostFrequentCount = aggregate.counts[String(mostFrequent)];
  const mostFrequentPercentage = (mostFrequentCount / aggregate.observed * 100).toFixed(1);
  return {
    kind: 'evidence',
    label: 'Descriptive floor-count context',
    message: `Applied P1 = ${p1}. It appears in ${count} of ${aggregate.observed} observable records (${percentage}%). The most frequent observed value is P1 = ${mostFrequent} (${mostFrequentCount}/${aggregate.observed}, ${mostFrequentPercentage}%). This comparison is descriptive evidence, not an instruction to change the design.`
  };
}

function buildP8Feedback(category) {
  const aggregate = DB.aggregates.p8;
  const count = aggregate.counts[category] || 0;
  const percentage = (count / aggregate.observed * 100).toFixed(1);
  const mostFrequent = P8_DISPLAY_ORDER.reduce((best, key) =>
    aggregate.counts[key] > aggregate.counts[best] ? key : best, P8_DISPLAY_ORDER[0]);
  const selectedLabel = P8_LABELS[category] || category;
  const leadingContext = category === mostFrequent
    ? 'It is the most frequent observed category.'
    : `The most frequent observed category is ${P8_LABELS[mostFrequent]} (${aggregate.counts[mostFrequent]}/${aggregate.observed}).`;
  return {
    kind: 'evidence',
    label: 'Descriptive facade-category context',
    message: `Applied ${selectedLabel}. It appears in ${count} of ${aggregate.observed} records (${percentage}%). ${leadingContext} This is categorical frequency, not a material recommendation.`
  };
}

function buildP9Feedback(material) {
  const aggregate = DB.aggregates.p9;
  if (material === '') {
    return {
      kind: 'evidence',
      label: 'Limited roof-material context',
      message: `Applied Unknown / Unavailable to the schematic. P9 is unavailable in ${aggregate.counts.NA} of ${aggregate.total} records. Only ${aggregate.observed}/${aggregate.total} records (${(aggregate.observability * 100).toFixed(1)}%) are observable, with uneven coverage across areas; this evidence cannot support population-level guidance.`
    };
  }
  const count = aggregate.counts[material] || 0;
  const label = P9_OPTIONS.find(option => option.key === material)?.label || material;
  return {
    kind: 'evidence',
    label: 'Limited roof-material context',
    message: `Applied ${label} to the schematic roof palette. It appears in ${count} of ${aggregate.observed} observable P9 records. Coverage is only ${aggregate.observed}/${aggregate.total} (${(aggregate.observability * 100).toFixed(1)}%) and is uneven across areas, so this limited record-level evidence must not be generalised and is not a recommendation.`
  };
}

function buildTechnicalFeedback(key, enteredValue, appliedValue, outcome = 'applied') {
  const constraint = PARAM_CONSTRAINTS[key];
  if (outcome === 'invalid') {
    const entered = enteredValue === '' ? 'An empty value' : `The entered value (${enteredValue})`;
    return {
      kind: 'warning',
      label: 'Value not applied',
      message: `${entered} was not applied. ${constraint.name} accepts technical rendering inputs from ${technicalRangeText(key)}. The previous valid value, ${formatTechnicalValue(key, appliedValue)}, was retained. This is input validation, not an architectural assessment.`
    };
  }
  const wasAligned = Math.abs(Number(enteredValue) - appliedValue) > 1e-9;
  if (wasAligned) {
    return {
      kind: 'technical',
      label: 'Technical step alignment',
      message: `The entered value, ${enteredValue}, was aligned to the nearest technical rendering step: ${formatTechnicalValue(key, appliedValue)}. Accepted technical display range: ${technicalRangeText(key)}. No validated building-level inventory measurement underlies this range, so no evidence-based target is produced.`
    };
  }
  return {
    kind: 'technical',
    label: 'Technical rendering input applied',
    message: `Applied ${constraint.name} = ${formatTechnicalValue(key, appliedValue)}. Accepted technical display range: ${technicalRangeText(key)}. No validated building-level inventory measurement underlies this range, so no evidence-based target is produced.`
  };
}

function wireDesignExplorerEvents() {
  // P1 integer input
  const p1Input = document.getElementById('p1-input');
  if (p1Input) {
    p1Input.addEventListener('input', () => {
      const num = Number(p1Input.value);
      if (Number.isInteger(num) && num >= 1 && num <= 5) {
        state.params.P1 = num;
        updateP1Trace();
        updateConfigSummary();
        scheduleSchematicUpdate();
        setInputFeedback(buildP1Feedback(num));
      } else {
        const previous = state.params.P1;
        p1Input.value = state.params.P1;
        setInputFeedback({
          kind: 'warning',
          label: 'Value not applied',
          message: `P1 accepts whole-number inputs from 1 to 5. The previous valid value, P1 = ${previous}, was retained. This is input validation, not an architectural assessment.`
        });
      }
    });
  }

  // P8 categorical select
  const p8Sel = document.getElementById('p8-select');
  if (p8Sel) {
    p8Sel.addEventListener('change', () => {
      state.params.P8 = p8Sel.value;
      updateP8Trace();
      updateConfigSummary();
      scheduleSchematicUpdate();
      setInputFeedback(buildP8Feedback(state.params.P8));
    });
  }

  // P9 categorical select
  const p9Sel = document.getElementById('p9-select');
  if (p9Sel) {
    p9Sel.addEventListener('change', () => {
      state.params.P9 = p9Sel.value;
      updateConfigSummary();
      scheduleSchematicUpdate();
      setInputFeedback(buildP9Feedback(state.params.P9));
    });
  }

  // Visualization-only numeric inputs with bounds/step validation
  const visMap = {
    'p2-input': 'P2', 'p3-input': 'P3', 'p4-input': 'P4',
    'p5-input': 'P5', 'p6-input': 'P6', 'p7-input': 'P7',
    'p10-input': 'P10', 'p11-input': 'P11', 'p12-input': 'P12'
  };
  for (const [id, key] of Object.entries(visMap)) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        const entered = el.value;
        const v = Number(entered);
        const c = PARAM_CONSTRAINTS[key];
        if (Number.isFinite(v) && v >= c.min && v <= c.max) {
          const applied = snapTechnicalValue(key, v);
          state.params[key] = applied;
          el.value = formatTechnicalNumber(key, applied);
          updateConfigSummary();
          scheduleSchematicUpdate();
          setInputFeedback(buildTechnicalFeedback(key, entered, applied));
        } else {
          const retained = state.params[key];
          el.value = formatTechnicalNumber(key, retained);
          setInputFeedback(buildTechnicalFeedback(key, entered, retained, 'invalid'));
        }
      });
      el.addEventListener('input', () => {
        const v = Number(el.value);
        const c = PARAM_CONSTRAINTS[key];
        if (Number.isFinite(v) && v >= c.min && v <= c.max) {
          state.params[key] = snapTechnicalValue(key, v);
          updateConfigSummary();
          scheduleSchematicUpdate();
        }
      });
    }
  }

  // Reset button
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      Object.assign(state.params, STARTING_VALUES);
      syncFormToState();
      updateP1Trace();
      updateP8Trace();
      updateConfigSummary();
      scheduleSchematicUpdate();
      setInputFeedback({
        kind: 'technical',
        label: 'Display values reset',
        message: 'All twelve controls were restored to their technical starting values. This is a neutral interface operation; it is not evidence, a regional norm, or a design recommendation.'
      });
    });
  }

  // JSON export button
  const jsonBtn = document.getElementById('export-json-btn');
  if (jsonBtn) {
    jsonBtn.addEventListener('click', exportJSON);
  }

  // SVG view toggle (Elevation / Plan)
  const tabElev = document.getElementById('tab-elev');
  const tabPlan = document.getElementById('tab-plan');
  const elevPanel = document.getElementById('elev-panel');
  const planPanel = document.getElementById('plan-panel');

  if (tabElev) {
    tabElev.addEventListener('click', () => {
      state.schemView = 'elevation';
      tabElev.setAttribute('aria-selected', 'true');
      tabElev.classList.add('view-tab--active');
      tabElev.removeAttribute('tabindex');
      tabPlan.setAttribute('aria-selected', 'false');
      tabPlan.classList.remove('view-tab--active');
      tabPlan.setAttribute('tabindex', '-1');
      elevPanel.hidden = false;
      planPanel.hidden = true;
      updateSchematic();
    });
  }

  if (tabPlan) {
    tabPlan.addEventListener('click', () => {
      state.schemView = 'plan';
      tabPlan.setAttribute('aria-selected', 'true');
      tabPlan.classList.add('view-tab--active');
      tabPlan.removeAttribute('tabindex');
      tabElev.setAttribute('aria-selected', 'false');
      tabElev.classList.remove('view-tab--active');
      tabElev.setAttribute('tabindex', '-1');
      planPanel.hidden = false;
      elevPanel.hidden = true;
      updateSchematic();
    });
  }

  // Arrow-key navigation between view tabs
  [tabElev, tabPlan].forEach((tab, i, arr) => {
    if (!tab) return;
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = arr[(i + (e.key === 'ArrowRight' ? 1 : -1) + arr.length) % arr.length];
        if (next) { next.focus(); next.click(); }
      }
    });
  });
}

function materialLabel(key) {
  return P8_LABELS[key] || key || 'Unavailable';
}

function ensureCaseDialog() {
  let dialog = document.getElementById('case-source-dialog');
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.id = 'case-source-dialog';
  dialog.className = 'case-source-dialog';
  dialog.innerHTML = `
    <div class="case-dialog-header">
      <h2 id="case-dialog-title">Source record</h2>
      <button type="button" class="detail-close-btn" aria-label="Close source record">✕</button>
    </div>
    <div id="case-dialog-content"></div>`;
  document.body.appendChild(dialog);
  dialog.querySelector('.detail-close-btn').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  return dialog;
}

function renderDocumentedCases() {
  const allCases = Array.isArray(window.TRABZON_DOCUMENTED_CASES) ? window.TRABZON_DOCUMENTED_CASES : [];
  const grid = document.querySelector('.case-grid');
  if (!grid) return;

  const areaSelect = document.getElementById('case-filter-area');
  const p1Select = document.getElementById('case-filter-p1');
  const p8Select = document.getElementById('case-filter-p8');
  const p9Select = document.getElementById('case-filter-p9');
  const count = document.getElementById('case-result-count');
  const clear = document.getElementById('case-filter-clear');
  const unique = (values) => [...new Set(values)].sort((a,b) => String(a).localeCompare(String(b), 'en'));

  unique(allCases.map(item => item.area)).forEach(value => {
    areaSelect?.insertAdjacentHTML('beforeend', `<option value="${escHtml(value)}">${escHtml(value)}</option>`);
  });
  unique(allCases.map(item => item.p8)).forEach(value => {
    p8Select?.insertAdjacentHTML('beforeend', `<option value="${escHtml(value)}">${escHtml(materialLabel(value))}</option>`);
  });

  const update = () => {
    const area = areaSelect?.value || '';
    const p1 = p1Select?.value || '';
    const p8 = p8Select?.value || '';
    const p9 = p9Select?.value || '';
    const filtered = allCases.filter(item => {
      const itemP1 = item.p1 == null ? 'unavailable' : String(item.p1);
      return (!area || item.area === area) && (!p1 || itemP1 === p1) &&
             (!p8 || item.p8 === p8) && (!p9 || item.p9Visibility === p9);
    });
    if (count) count.textContent = `${filtered.length} of ${allCases.length} researcher-validated documented cases shown.`;
    grid.innerHTML = filtered.map(item => {
      const p1Text = item.p1 == null ? 'Unavailable in source' : `${item.p1} visible floor${item.p1 === 1 ? '' : 's'}`;
      const p9Text = item.p9 || 'Unavailable in source';
      return `<article class="case-card" data-record-id="${escHtml(item.recordId)}">
        <button type="button" class="case-image-button" data-action="source" aria-label="View source record ${escHtml(item.recordId)}">
          <img src="${escHtml(item.image)}" alt="Source inventory record ${escHtml(item.recordCode)} in ${escHtml(item.area)}" loading="lazy">
          <span>View source record</span>
        </button>
        <div class="case-card__body">
          <h3>${escHtml(item.recordCode)} · ${escHtml(item.area)}</h3>
          <p class="case-source">Working PDF page ${item.sourcePdfPage} · Validation sample ${item.sampleNumber}/30</p>
          <dl>
            <div><dt>P1</dt><dd>${escHtml(p1Text)}</dd></div>
            <div><dt>P8</dt><dd>${escHtml(materialLabel(item.p8))}</dd></div>
            <div><dt>P9</dt><dd>${escHtml(p9Text)}</dd></div>
          </dl>
          <p class="case-status">Researcher validated</p>
          <p class="case-evidence-note">P1 and P8 collective confirmation; P9 shown only where observable.</p>
          <button type="button" class="btn btn--secondary case-load" data-action="load">View coded attributes</button>
        </div>
      </article>`;
    }).join('') || '<p class="case-empty">No documented cases match these filters.</p>';
  };

  [areaSelect,p1Select,p8Select,p9Select].forEach(el => el?.addEventListener('change', update));
  clear?.addEventListener('click', () => {
    [areaSelect,p1Select,p8Select,p9Select].forEach(el => { if (el) el.value = ''; });
    update();
  });
  grid.addEventListener('click', event => {
    const card = event.target.closest('.case-card');
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!card || !action) return;
    const item = allCases.find(entry => entry.recordId === card.dataset.recordId);
    if (!item) return;
    if (action === 'source') {
      const dialog = ensureCaseDialog();
      dialog.querySelector('#case-dialog-title').textContent = `${item.recordCode} · ${item.area}`;
      dialog.querySelector('#case-dialog-content').innerHTML = `
        <img src="${escHtml(item.image)}" alt="Source inventory record ${escHtml(item.recordId)}">
        <p><strong>Source:</strong> ${escHtml(item.sourceLabel)}</p>
        <p><strong>Location in working digital PDF:</strong> page ${item.sourcePdfPage}. This is not the printed page number.</p>
        <p><strong>Interpretation boundary:</strong> The source image documents the inventory record. The interface representation is schematic and is not a measured reconstruction.</p>`;
      dialog.showModal();
      return;
    }
    if (item.p1 != null) state.params.P1 = item.p1;
    state.params.P8 = item.p8;
    state.params.P9 = item.p9 || '';
    syncFormToState(); updateP1Trace(); updateP8Trace(); populateP9Trace();
    updateConfigSummary(); scheduleSchematicUpdate();
    const loaded = [item.p1 == null ? null : 'P1', 'P8', item.p9 ? 'P9' : null].filter(Boolean).join(', ');
    setInputFeedback({
      kind: 'evidence', label: 'Documented record attributes loaded',
      message: `Applied ${loaded} from ${item.recordId}. Unavailable attributes were not inferred. P2–P7 and P10–P12 remain neutral visualization-only values and are not measurements of this building.`
    });
    document.getElementById('tab-design')?.click();
    document.getElementById('p1-block')?.scrollIntoView({ block: 'start' });
  });
  update();
}

function wireDocumentedCases() {
  renderDocumentedCases();
}

/** Sync all form controls to current state.params */
function syncFormToState() {
  const p = state.params;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  set('p1-input',  p.P1);
  set('p2-input',  p.P2);
  set('p3-input',  p.P3);
  set('p4-input',  p.P4);
  set('p5-input',  p.P5);
  set('p6-input',  p.P6);
  set('p7-input',  p.P7);
  set('p8-select', p.P8);
  set('p9-select', p.P9);
  set('p10-input', p.P10);
  set('p11-input', p.P11);
  set('p12-input', p.P12);
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 13 — EVIDENCE EXPLORER
───────────────────────────────────────────────────────────────────── */

function filterRecords() {
  const f  = state.filters;
  const ar = DB.analysisRecords;

  state.visibleRecords = ar.filter(r => {
    // Text search: record_id, area, record_code, plus raw source fields
    if (f.text) {
      const q = f.text.toLowerCase();
      const searchable = [
        r.record_id, r.area, r.record_code,
        r.building_type_raw, r.material_raw, r.construction_technique_raw,
        r.original_function_raw, r.current_function_raw,
        r.p8_evidence_raw, r.p1_evidence_raw, r.p9_evidence_raw
      ].map(v => (v || '').toLowerCase()).join(' ');
      if (!searchable.includes(q)) return false;
    }

    if (f.area && r.area !== f.area) return false;
    if (f.inclusion && r.inclusion_status !== f.inclusion) return false;

    if (f.p1) {
      if (f.p1 === 'NA') {
        if (r.p1_visible_floor_count != null) return false;
      } else {
        if (r.p1_visible_floor_count !== parseInt(f.p1, 10)) return false;
      }
    }

    if (f.p8 && r.p8_material_category !== f.p8) return false;

    if (f.p9) {
      if (r.p9_visibility !== f.p9) return false;
    }

    if (f.construction && r.construction_system_normalized !== f.construction) return false;
    if (f.review && r.review_status !== f.review) return false;

    return true;
  });
}

function renderTable() {
  const tbody   = document.getElementById('records-tbody');
  const noRes   = document.getElementById('no-results');
  const countEl = document.getElementById('record-count');

  if (!tbody) return;

  const records = state.visibleRecords;
  const total   = DB.analysisRecords.length;

  // Update count live region (debounced by caller)
  if (countEl) {
    countEl.textContent = `Showing ${records.length} of ${total} analysis records`;
  }

  if (records.length === 0) {
    tbody.innerHTML = '';
    if (noRes) noRes.hidden = false;
    return;
  }

  if (noRes) noRes.hidden = true;

  const p1DisplayFn = v => v === null ? 'Unavailable' : String(v);
  const p9CellFn = r => {
    const unavail = r.p9_roof_material_limited == null || r.p9_roof_material_limited === '';
    if (unavail) return '<span style="color:var(--t-3)">Unavailable</span>';
    return escHtml(r.p9_roof_material_limited);
  };

  tbody.innerHTML = records.map((r, idx) => {
    const incClass  = r.inclusion_status === 'included'  ? 'status-included' :
                      r.inclusion_status === 'partially included' ? 'status-partial' : '';
    const revClass  = r.review_status === 'researcher validated' ? 'status-validated' : 'status-review';
    const revLabel  = r.review_status === 'researcher validated' ? '✓ Validated' : 'Review required';

    return `<tr>
      <td class="cell-id">${escHtml(r.record_id)}</td>
      <td>${escHtml(r.area)}</td>
      <td>${r.source_pdf_page}</td>
      <td class="${incClass}">${escHtml(r.inclusion_status)}</td>
      <td>${p1DisplayFn(r.p1_visible_floor_count)}</td>
      <td>${escHtml(r.p8_material_category)}</td>
      <td>${p9CellFn(r)}</td>
      <td>${escHtml(r.construction_system_normalized)}</td>
      <td class="${revClass}">${revLabel}</td>
      <td><button type="button" class="btn-detail" data-idx="${idx}" aria-label="Open details for record ${escHtml(r.record_id)}">Details</button></td>
    </tr>`;
  }).join('');

  // Wire Details buttons (do NOT rely on row click)
  tbody.querySelectorAll('button.btn-detail[data-idx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      const rec = state.visibleRecords[idx];
      if (rec) {
        state.lastDetailTrigger = btn;
        openRecordDetail(rec);
      }
    });
  });
}

function scheduleFilterUpdate() {
  clearTimeout(filterDebounce);
  filterDebounce = setTimeout(() => {
    filterRecords();
    renderTable();
    updateActiveFilterCount();
  }, 150);
}

function updateActiveFilterCount() {
  const f   = state.filters;
  const cnt = Object.values(f).filter(v => v !== '').length;
  const badge = document.getElementById('active-filter-count');
  if (badge) {
    badge.textContent = String(cnt);
    badge.hidden = cnt === 0;
  }
}

function buildExplorerDistributions() {
  const el = document.getElementById('explorer-distributions');
  if (!el) return;

  const aggP1 = DB.aggregates.p1;
  const aggP8 = DB.aggregates.p8;

  // P1 distribution panel
  let p1Html = `<div class="dist-panel">
    <div class="dist-panel__title">P1 — Visible Floor Count distribution (N=${aggP1.observed}/${aggP1.total} observable)</div>
    <div class="dist-bars">`;
  for (const v of [1, 2, 3, 4, 5]) {
    const count = aggP1.counts[String(v)] || 0;
    const pct   = ((count / aggP1.observed) * 100).toFixed(1);
    p1Html += `<div class="dist-bar-row">
      <span class="dist-bar-label">P1=${v}</span>
      <div class="dist-bar-track"><div class="dist-bar-fill" style="width:${pct}%"></div></div>
      <span class="dist-bar-count">${count} &nbsp; (${pct}%)</span>
    </div>`;
  }
  p1Html += `</div>
    <div class="dist-denom">Denominator: ${aggP1.observed} observable records · ${aggP1.counts['NA']} unavailable</div>
  </div>`;

  // P8 distribution panel
  let p8Html = `<div class="dist-panel">
    <div class="dist-panel__title">P8 — Facade/Construction Material Category distribution (N=${aggP8.observed}/${aggP8.total})</div>
    <div class="dist-bars">`;
  for (const key of P8_DISPLAY_ORDER) {
    const count = aggP8.counts[key] || 0;
    const pct   = ((count / aggP8.observed) * 100).toFixed(1);
    p8Html += `<div class="dist-bar-row">
      <span class="dist-bar-label">${escHtml(P8_LABELS[key] || key)}</span>
      <div class="dist-bar-track"><div class="dist-bar-fill" style="width:${pct}%"></div></div>
      <span class="dist-bar-count">${count} &nbsp; (${pct}%)</span>
    </div>`;
  }
  p8Html += `</div>
    <div class="dist-denom">Denominator: ${aggP8.observed} records (100% observed)</div>
  </div>`;

  el.innerHTML = p1Html + p8Html;
}

function wireExplorerFilters() {
  const filterIds = {
    'filter-text':        'text',
    'filter-area':        'area',
    'filter-inclusion':   'inclusion',
    'filter-p1':          'p1',
    'filter-p8':          'p8',
    'filter-p9':          'p9',
    'filter-construction':'construction',
    'filter-review':      'review'
  };

  for (const [id, key] of Object.entries(filterIds)) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input',  () => { state.filters[key] = el.value; scheduleFilterUpdate(); });
      el.addEventListener('change', () => { state.filters[key] = el.value; scheduleFilterUpdate(); });
    }
  }

  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      for (const key of Object.keys(state.filters)) state.filters[key] = '';
      // Reset all filter controls
      for (const id of Object.keys(filterIds)) {
        const el = document.getElementById(id);
        if (el) el.value = '';
      }
      filterRecords();
      renderTable();
      updateActiveFilterCount();
    });
  }

  // CSV export
  const csvBtn = document.getElementById('export-csv-btn');
  if (csvBtn) {
    csvBtn.addEventListener('click', exportFilteredCSV);
  }
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 14 — RECORD DETAIL DIALOG
───────────────────────────────────────────────────────────────────── */

function openRecordDetail(rec) {
  const dialog  = document.getElementById('record-detail');
  const titleEl = document.getElementById('detail-title');
  const content = document.getElementById('detail-content');
  if (!dialog || !content) return;

  if (titleEl) titleEl.textContent = `Record: ${rec.record_code || rec.record_id}`;

  const p1Display   = rec.p1_visible_floor_count === null ? 'Unavailable' : String(rec.p1_visible_floor_count);
  const p9Unavailable = rec.p9_roof_material_limited == null || rec.p9_roof_material_limited === '';
  const p9Display   = p9Unavailable ? 'Unavailable (limited evidence)' : rec.p9_roof_material_limited;
  const revLabel    = rec.review_status === 'researcher validated'
                        ? '✓ Researcher validated (collective confirmation, 2026-08-12)'
                        : 'Researcher review required';

  const field = (title, value, cls = '', wide = false) =>
    `<div class="detail-section${wide ? '' : ' detail-section--half'}">
       <div class="detail-section-title">${escHtml(title)}</div>
       <div class="detail-value${cls ? ' '+cls : ''}">${value == null || value === '' ? '<span style="color:var(--t-3)">—</span>' : escHtml(String(value))}</div>
     </div>`;

  content.innerHTML = `
    ${field('Record ID',          rec.record_id)}
    ${field('Record Code',        rec.record_code)}
    ${field('Area',               rec.area)}
    ${field('PDF Page',           rec.source_pdf_page)}
    ${field('Inclusion Status',   rec.inclusion_status)}
    ${field('Review Status',      revLabel)}
    ${field('P1 — Visible Floor Count', p1Display)}
    ${field('P8 — Facade Category',     P8_LABELS[rec.p8_material_category] || rec.p8_material_category)}
    ${field('P9 — Roof Material (limited evidence)', p9Display)}
    ${field('P9 Visibility',      rec.p9_visibility)}
    ${field('Construction System', rec.construction_system_normalized)}
    <div class="detail-section">
      <div class="detail-section-title">Raw Source Fields</div>
      <div class="detail-value detail-value--mono">${[
        rec.building_type_raw, rec.period_raw, rec.construction_technique_raw,
        rec.material_raw, rec.original_function_raw, rec.current_function_raw
      ].filter(v => v && v.trim()).map(v => escHtml(v)).join('\n') || '—'}</div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">Evidence Notes</div>
      <div class="detail-value detail-value--mono">${[
        rec.p1_evidence_raw ? 'P1: ' + rec.p1_evidence_raw : '',
        rec.p8_evidence_raw ? 'P8: ' + rec.p8_evidence_raw : '',
        rec.p9_evidence_raw ? 'P9: ' + rec.p9_evidence_raw : ''
      ].filter(Boolean).map(v => escHtml(v)).join('\n') || '—'}</div>
    </div>
    ${field('Source Filename',  rec.source_file, 'detail-value--mono', true)}`;

  dialog.showModal();

  // Move focus into dialog
  const closeBtn = document.getElementById('detail-close-btn');
  if (closeBtn) closeBtn.focus();
}

function wireRecordDialog() {
  const dialog   = document.getElementById('record-detail');
  const closeBtn = document.getElementById('detail-close-btn');
  if (!dialog) return;

  const closeDialog = () => {
    dialog.close();
    if (state.lastDetailTrigger) {
      state.lastDetailTrigger.focus();
      state.lastDetailTrigger = null;
    }
  };

  if (closeBtn) closeBtn.addEventListener('click', closeDialog);

  dialog.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); closeDialog(); }
    // Focus trap within dialog
    if (e.key === 'Tab') {
      const focusable = [...dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )].filter(el => !el.disabled);
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });

  // Close on backdrop click
  dialog.addEventListener('click', e => {
    if (e.target === dialog) closeDialog();
  });
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 15 — CSV EXPORT
───────────────────────────────────────────────────────────────────── */

function exportFilteredCSV() {
  const records = state.visibleRecords;
  const headers = [
    'record_id','area','source_pdf_page','record_code','inclusion_status',
    'p1_visible_floor_count','p8_material_category','p9_roof_material_limited',
    'p9_visibility','construction_system_normalized','review_status',
    'building_type_raw','period_raw','construction_technique_raw','material_raw',
    'original_function_raw','current_function_raw',
    'p1_evidence_raw','p8_evidence_raw','p9_evidence_raw','source_file'
  ];

  const csvEscape = val => {
    const s = val == null ? '' : String(val);
    // Always quote; double internal quotes; replace literal newlines
    return '"' + s.replace(/"/g, '""').replace(/\r?\n/g, '\\n') + '"';
  };

  const rows = [
    headers.map(csvEscape).join(','),
    ...records.map(r =>
      headers.map(h => csvEscape(r[h] !== undefined ? r[h] : '')).join(',')
    )
  ].join('\r\n');

  // UTF-8 with BOM
  const bom  = '﻿';
  const blob = new Blob([bom + rows], { type: 'text/csv;charset=utf-8;' });
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `trabzon-analysis-records-filtered-${dateStr}.csv`);
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 16 — METHOD & LIMITS VIEW
───────────────────────────────────────────────────────────────────── */

function buildMethodContent() {
  const agg  = DB.aggregates;
  const rel  = agg.p1P8RelationshipTest;
  const val  = DB.validation;
  const meta = DB.metadata;
  const el   = document.getElementById('method-content');
  if (!el) return;

  // Parameter evidence status table rows
  const paramRows = [
    ['P1', 'Visible floor count',                    '◆ Descriptive',    `${agg.p1.observed}/${agg.p1.total} (${(agg.p1.observability*100).toFixed(1)}%)`, 'Floor count distribution from visual audit'],
    ['P2', 'Building width',                          '● Visualization-only', 'No inventory measurement', 'Technical rendering constraint only'],
    ['P3', 'Building depth',                          '● Visualization-only', 'No inventory measurement', 'Technical rendering constraint only'],
    ['P4', 'Window-to-wall ratio',                    '● Visualization-only', 'No inventory measurement', 'Technical rendering constraint only'],
    ['P5', 'Roof slope',                              '● Visualization-only', 'No inventory measurement', 'Technical rendering constraint only'],
    ['P6', 'Eave depth',                              '● Visualization-only', 'No inventory measurement', 'Technical rendering constraint only'],
    ['P7', 'Storey height',                           '● Visualization-only', 'No inventory measurement', 'Technical rendering constraint only'],
    ['P8', 'Facade/construction material category',   '◆ Descriptive',    `${agg.p8.observed}/${agg.p8.total} (100%)`, 'Material category distribution from inventory fiche text and photograph'],
    ['P9', 'Roof material',                           '▲ Limited evidence', `${agg.p9.observed}/${agg.p9.total} (${(agg.p9.observability*100).toFixed(1)}%)`, 'Low, area-imbalanced coverage; must not be generalised'],
    ['P10','Balcony depth',                           '● Visualization-only', 'No inventory measurement', 'Technical rendering constraint only'],
    ['P11','Balcony width ratio',                     '● Visualization-only', 'No inventory measurement', 'Technical rendering constraint only'],
    ['P12','Wall thickness',                          '● Visualization-only', 'No inventory measurement', 'Technical rendering constraint only']
  ];

  el.innerHTML = `

    <div class="method-section">
      <h3>1. Inventory and Scope</h3>
      <p>The source is the <em>Trabzon Kent İçi Kültür Varlıkları Envanteri</em> (Özen et al., 2010), pages 291–448. This inventory records residential buildings in Trabzon's historic urban fabric using standardised inventory fichas (fişler).</p>
      <p>The inventory assigns <strong>265 codes</strong> to residential candidates. Two codes refer to the same physical building; therefore the independent candidate set contains <strong>264 records</strong>. Of these, <strong>183 records</strong> were analysed (146 included, 37 partially included). <strong>81 records</strong> were excluded: 56 did not have a residential original function or building type, and 25 were recorded as reinforced-concrete or reconstructed buildings. Excluded records remain visible only in the candidate-scope data.</p>
      <p>Masonry appears in 178 of 183 preliminary normalized construction-system records (97.3%). This is contextual descriptive information; five records remain other/unclear and require human review.</p>
    </div>

    <div class="method-section">
      <h3>2. Initial Data Structuring</h3>
      <p><strong>Method flow:</strong> inventory sheets → assisted initial structuring → scope screening → P1 visual audit → 30-record collective confirmation → descriptive evidence interface.</p>
      <p>A vision-language model assisted the preliminary transfer of visual and textual information into a common data structure. The current browser interface performs no AI inference. The available study documentation does not report the model version, prompts, or inference settings, and no systematic model-accuracy evaluation was conducted. The AI-assisted step is therefore not presented as a validated methodological contribution.</p>
    </div>

    <div class="method-section">
      <h3>3. Scope Screening and Inclusion Criteria</h3>
      <p>Each of the 264 candidates was reviewed against a documented inclusion protocol. Records were classified as:</p>
      <ul>
        <li><strong>Included (146 records):</strong> met the inclusion criteria and were retained in the analysis dataset. P8 was coded for every included record; P1 was coded only where visible floor count could be confirmed.</li>
        <li><strong>Partially included (37 records):</strong> originated as residential buildings but were retained with limitations related to current use or physical condition.</li>
        <li><strong>Excluded (81 records):</strong> 56 non-residential original functions or building types and 25 reinforced-concrete or reconstructed records. These appear only in the candidate scope.</li>
      </ul>
    </div>

    <div class="method-section">
      <h3>4. P1 Second Visual Audit</h3>
      <p>Visible floor count (P1) values extracted in the initial pass were subject to a second visual audit, reviewing inventory photographs and street-level views where available. Of 183 analysis records, <strong>160</strong> have an observable P1 value (${(agg.p1.observability*100).toFixed(2)}%). <strong>23</strong> records could not be confirmed visually and are marked unavailable.</p>
      <p>Distribution among observed records (N = 160):</p>
      <ul>
        <li>P1 = 1: 3 records (1.875%)</li>
        <li>P1 = 2: 70 records (43.750%)</li>
        <li>P1 = 3: 78 records (48.750%)</li>
        <li>P1 = 4: 8 records (5.000%)</li>
        <li>P1 = 5: 1 record (0.625%)</li>
      </ul>
    </div>

    <div class="method-section">
      <h3>5. Researcher Collective Confirmation</h3>
      <div class="limitation-callout">
        The researcher collectively reviewed the existing P1 states and P8 codes in the selected 30-record sample. Four P1 states remain unavailable. The review was not an independent blind recoding exercise; therefore, it must not be interpreted as inter-rater reliability, model accuracy, or a guarantee for all 183 records.
      </div>
      <p>The researcher collectively confirmed the existing P1 states and P8 codes in the selected 30-record sample on ${val.date}. Four sampled records retain an unavailable P1 state because visible floor count could not be confirmed; no value was inferred for them. The confirmation exercise reported no required corrections. It was not independent blind recoding and does not provide a model-accuracy or inter-rater reliability estimate.</p>
      <p>The 30-record confirmation covered ${val.researcherValidatedRowsInFullDataset} of the 183 analysis records. The remaining ${val.remainingRowsRequiringResearcherReview} records have the status "researcher review required" and are individually identifiable in the Evidence Explorer.</p>
    </div>

    <div class="method-section">
      <h3>6. Parameter Evidence Status</h3>
      <p>The table below summarises the evidence class and observability for each of the twelve interface parameters. Parameters P2–P7 and P10–P12 lack reliable building-level inventory measurements. Their technical ranges and starting values are rendering constraints only.</p>
      <table class="param-evidence-table">
        <thead>
          <tr>
            <th>Param</th>
            <th>Name</th>
            <th>Evidence Class</th>
            <th>Observability</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          ${paramRows.map(r => `<tr>${r.map(c => `<td>${escHtml(c)}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
      <p>P9 roof material has low and area-imbalanced coverage: ${agg.p9.observed} records observable, ${agg.p9.counts['NA']} unavailable. The observable records are not evenly distributed across the eight inventory areas. No generalisation from these ${agg.p9.observed} records to the full population is warranted.</p>
    </div>

    <div class="method-section">
      <h3>7. Methodological Boundaries</h3>
      <p><strong>This interface is not a shape grammar.</strong> It does not derive dynamic part relations or production rules. It uses a fixed attribute schema and schematic controls to display selected inventory information.</p>
      <p>The interface organizes 183 records, distinguishes evidence conditions, and links the complete 30-record researcher-validated subset to source images. It does not generate design rules, perform live AI inference, reconstruct measured buildings, assess regional authenticity, calculate compatibility or confidence scores, or evaluate architectural quality.</p>
      <p>No user study was conducted. The prototype has not been evaluated for usability, improvement in user understanding, heritage decision support, or effects on design reasoning. Functional checks establish software operation only.</p>
    </div>

    <div class="method-section">
      <h3>7. Statistical Tests and Rejected Relationships</h3>
      <h4>P1 × P8 association test (rejected)</h4>
      <p>An exploratory chi-square test of association between P1 and P8 was conducted, restricted to the two dominant P1 groups (P1 = 2: 70 records; P1 = 3: 78 records; N = 148 total) with grouped P8 categories. P8 is available for all 183 records; this restriction reflects the test design, not missing data.</p>
      <div class="stat-box">
        <span class="stat-key">N = </span><span class="stat-val">${rel.n}</span><br>
        <span class="stat-key">chi-square = </span><span class="stat-val">${rel.chiSquare.toFixed(3)}</span><br>
        <span class="stat-key">df = </span><span class="stat-val">${rel.degreesOfFreedom}</span><br>
        <span class="stat-key">p = </span><span class="stat-val">${rel.pValue.toFixed(5)}</span><br>
        <span class="stat-key">Cramér's V = </span><span class="stat-val">${rel.cramersV.toFixed(5)}</span><br>
        <span class="stat-key">Decision: </span><span class="stat-val">${rel.decision}</span>
      </div>
      <p>This result is not statistically significant at the conventional α = 0.05 threshold. No conditional rule linking P1 to P8, automatic recommendation, or score derived from this relationship is implemented.</p>
      <h4>P5 – P6 relationship (rejected)</h4>
      <p>No relationship between roof slope (P5) and eave depth (P6) is implemented. No reliable per-building measurements of either parameter exist in the inventory. Changing P5 never changes P6, and vice versa.</p>
    </div>

    <div class="method-section">
      <h3>8. Why No Overall Score or AI Confidence</h3>
      <p>No metric with a sound scientific basis for combining these parameters into an overall compatibility, vernacularity, or authenticity score was found. Specifically:</p>
      <ul>
        <li>P1 and P8 provide descriptive frequency distributions, not design targets or benchmarks.</li>
        <li>P2–P7 and P10–P12 lack validated building-level inventory measurements; combining unmeasured parameters with observed distributions would produce a meaningless aggregate.</li>
        <li>P9 has 29.0% observability with area-imbalanced missingness; it cannot anchor a general confidence score.</li>
        <li>The P1 × P8 association is statistically unsupported (p = ${rel.pValue.toFixed(3)}), so weighting these parameters relative to each other is unwarranted.</li>
      </ul>
      <p>AI confidence, probability, or accuracy outputs require a validated ground-truth reference set for calibration. No such set exists for vernacular architectural typology judgment at this resolution. Generating a confidence score without calibration would be scientifically misleading.</p>
      <p>The Design Explorer therefore uses a non-evaluative <strong>Input Feedback &amp; Evidence Context</strong> panel. It reports whether a technical rendering input was applied, rejected, or aligned to the defined display step. For P1 and P8 it also reports descriptive frequency context. The panel does not tell the user how a design should change and does not convert technical display ranges into architectural guidance.</p>
    </div>

    <div class="method-section">
      <h3>9. Source Attribution</h3>
      <p>
        <strong>Inventory:</strong> Trabzon Kent İçi Kültür Varlıkları Envanteri (Özen et al., 2010), pages 291–448.<br>
        <strong>Dataset version:</strong> ${meta.datasetVersion}<br>
        <strong>Source PDF:</strong> ${meta.sourceFile}<br>
        <strong>Researcher confirmation date:</strong> ${val.date}
      </p>
      <p>The interface, dataset, and methodology are described in: <em>From Inventory to Interface: A Provenance-Aware Representation of Trabzon Vernacular Houses</em> (v1.2.0 – Documented Cases Build).</p>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 17 — MAIN TAB NAVIGATION
───────────────────────────────────────────────────────────────────── */

function setupMainTabs() {
  const tabs   = document.querySelectorAll('.tab-list [role="tab"]');
  const panels = {
    'tab-design':   document.getElementById('panel-design'),
    'tab-evidence': document.getElementById('panel-evidence'),
    'tab-method':   document.getElementById('panel-method')
  };

  function activateTab(tabEl) {
    tabs.forEach(t => {
      const isThis = t === tabEl;
      t.setAttribute('aria-selected', isThis ? 'true' : 'false');
      t.setAttribute('tabindex', isThis ? '0' : '-1');
      t.classList.toggle('tab-btn--active', isThis);
    });
    for (const [id, panel] of Object.entries(panels)) {
      if (!panel) continue;
      const active = tabEl.id === id;
      panel.hidden = !active;
      panel.classList.toggle('view-panel--active', active);
    }
    state.activeView = tabEl.id.replace('tab-', '');
  }

  tabs.forEach((tab, i, arr) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', e => {
      let next = null;
      if (e.key === 'ArrowRight') { next = arr[(i + 1) % arr.length]; }
      if (e.key === 'ArrowLeft')  { next = arr[(i - 1 + arr.length) % arr.length]; }
      if (next) { e.preventDefault(); next.focus(); activateTab(next); }
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 18 — UTILITY HELPERS
───────────────────────────────────────────────────────────────────── */

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 1000);
}

function showFatalError(msg) {
  const el = document.getElementById('integrity-error');
  const listEl = document.getElementById('integrity-error-list');
  if (el) el.hidden = false;
  if (listEl) listEl.innerHTML = `<li>${escHtml(msg)}</li>`;
  document.querySelectorAll('.view-panel').forEach(p => p.hidden = true);
}

function showIntegrityWarning(failures) {
  const el = document.getElementById('integrity-error');
  const listEl = document.getElementById('integrity-error-list');
  if (el) el.hidden = false;
  if (listEl) listEl.innerHTML = failures.map(f => `<li>${escHtml(f)}</li>`).join('');
  document.querySelectorAll('.view-panel').forEach(p => p.hidden = true);
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 19 — RESPONSIVE: RESIZE OBSERVER
───────────────────────────────────────────────────────────────────── */

function setupResizeObserver() {
  const containers = [
    document.getElementById('elev-panel'),
    document.getElementById('plan-panel')
  ].filter(Boolean);

  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => scheduleSchematicUpdate());
    containers.forEach(c => ro.observe(c));
  }
}

/* ─────────────────────────────────────────────────────────────────────
   SECTION 20 — INITIALIZATION
───────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function init() {

  // 1. Verify data is available
  if (typeof window.ASCAAD26_EVIDENCE_DATA === 'undefined') {
    showFatalError(
      'Evidence data file not loaded. Ensure data/ascaad26-evidence-data.js is present ' +
      'and loaded before src/app.js in index.html.'
    );
    return;
  }

  DB = window.ASCAAD26_EVIDENCE_DATA;

  // 2. Run integrity checks
  const checks = runIntegrityChecks(
    DB.candidateScope,
    DB.analysisRecords,
    DB.researcherValidation,
    DB.aggregates,
    DB.validation
  );

  if (!checks.passed) {
    showIntegrityWarning(checks.failures);
    return;
  }

  // 3. Initialise state
  state.params         = { ...STARTING_VALUES };
  state.visibleRecords = [...DB.analysisRecords];
  state.activeView     = 'design';
  state.schemView      = 'elevation';

  // 4. Build Design Explorer UI
  buildScopeGrid();
  buildP8Select();

  // 5. Build Evidence Explorer options
  buildAreaFilterOptions();
  buildP8FilterOptions();

  // 6. Build Method & Limits content
  buildMethodContent();

  // 6b. Build Evidence Explorer distribution panels
  buildExplorerDistributions();

  // 7. Wire all events
  setupMainTabs();
  wireDesignExplorerEvents();
  wireDocumentedCases();
  wireExplorerFilters();
  wireRecordDialog();

  // 8. Initial renders
  updateP1Trace();
  updateP8Trace();
  populateP9Trace();
  updateConfigSummary();
  setInputFeedback(buildP1Feedback(state.params.P1));
  updateSchematic();
  renderTable();

  // 9. Resize observer
  setupResizeObserver();
});
