/**
 * Adapted from exteestudio/venom-button, ca890bd, MIT © 2026 exteestudio.
 * Original simulation, SDF primitives, studio material and three-pass renderer.
 * Storylio changes: component lifecycle, bounded transparent canvas, DOM sizing/font.
 * See LICENSE and README.md beside this file. No demo UI or embedded Geist font.
 */
/** biome-ignore-all lint: Preserve the upstream numerical renderer; typed boundary is engine.d.ts. */
import { prepareVenomAssets } from "./icon-textures";

export { prepareVenomAssets };

export function createVenomScene(canvas, hitEl) {
  let disposed = false,
    paused = false,
    stillCanvas = null,
    gl = null,
    raf = 0,
    resizeObserver;
  let area = { left: 0, top: 0, width: 1, height: 1 };
  const controller = new AbortController();
  const resources = new Map();
  const cursorStyle = document.createElement("style");
  cursorStyle.textContent =
    "html[data-storylio-venom-cursor] * { cursor: none !important; }";
  document.head.append(cursorStyle);
  const cursorOwner = String(Math.random());
  const own = (kind, object) => {
    resources.set(object, kind);
    return object;
  };
  const release = (kind, object) => {
    gl["delete" + kind](object);
    resources.delete(object);
  };
  const listen = (target, name, handler, options = {}) =>
    target.addEventListener(name, handler, {
      ...options,
      signal: controller.signal,
    });
  const cursor = (on) => {
    if (on) document.documentElement.dataset.storylioVenomCursor = cursorOwner;
    else if (
      document.documentElement.dataset.storylioVenomCursor === cursorOwner
    )
      delete document.documentElement.dataset.storylioVenomCursor;
  };
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    controller.abort();
    resizeObserver?.disconnect();
    cursor(false);
    cursorStyle.remove();
    if (gl) for (const [object, kind] of resources) gl["delete" + kind](object);
    resources.clear();
    stillCanvas?.remove();
    stillCanvas = null;
    canvas.style.opacity = "0";
    delete hitEl.dataset.venomReady;
  }
  try {
    // ───────────────────────────── constants & state ─────────────────────────────
    const NP = 14; // points per tendril
    const MAXB = 5; // blobs (cursor droplet + crawlers)
    const MAXR = 6; // surface ripples
    const MAXBR = 9; // silk bridges between neighbouring tendrils
    const SUB = 1 / 240; // physics substep (small steps beat many iterations)
    const ITER = 3;
    let CURZ = 25; // height the cursor icon floats at: just above the button's top (follows its lift)
    const PEAK_H = 15;

    const P = {
      reach: 120, // px from the edge where tendrils launch
      awareness: 220, // px where the surface starts leaning toward the cursor
      maxStrands: 6,
      snapStretch: 1.6, // stretch ratio that snaps a fast pull
      maxLen: 160, // absolute length that always snaps
      creep: 0.25, // viscous flow (1/s): high = strands lengthen instead of snapping
      slither: 1.0,
      whip: 1.0,
      magnet: 1.6, // how hard the goo is drawn toward the cursor
      grip: 1.0, // how much the web tugs and turns the cursor once it has wrapped it
      thickness: 1.0,
      pull: 1.0,
      gravity: 900,
      sheen: 0,
    };

    const reduced = false; // The React adapter handles live motion preferences.

    const VIEW_SCALE = 1;
    const viewW = () => area.width,
      viewH = () => area.height;
    const font = getComputedStyle(hitEl);
    const LABEL_TEXT = hitEl.textContent || "";
    const fontReady = Promise.resolve();
    const LABEL_NUDGE = 1; // px the label sits below centre
    const LABEL_PX = 120; // glyph size drawn into the label canvas
    const LABEL_CSS = Number.parseFloat(font.fontSize); // on-screen label size, CSS px
    const LIFT_H = 14; // how far the whole slab rises off the floor on hover, px
    const BEVEL = 3; // edge rounding of the slab: small = the shine runs right up to the border
    let labelInkW = 0; // drawn width of the current label, canvas px

    const strands = [];
    const crawlers = [];
    const ripples = [];
    // the Figma hand becomes a 3D object in the scene while the goo is engaged, so tendrils can wrap it
    const HAND_BIG = 2.3; // px per icon unit when hovering: 24px icon → ~55px
    const hand = {
      m: 0,
      mV: 0,
      s: HAND_BIG,
      v: 0,
      ang: 0,
      angV: 0,
      on: false,
      ready: false,
      coat: -60,
      coatV: 0,
      thr: 0.8,
      ox: 0,
      oy: 0,
      oxV: 0,
      oyV: 0,
    }; // ox/oy: how far the web has tugged the drawn icon off the real pointer
    const PULL_MAX = 10; // px the web can tug the cursor icon
    const TILT_MAX = 0.36; // rad the pull can turn the hand (~20°)
    const WRIST_ANG = Math.atan2(15.5, 5.7); // icon-space direction from the fingertip to the wrist
    // wrap sites in icon units (24-unit frame): axis a→b, half width, turns, axial span
    const FINGERS = [
      {
        a: [8.45, 4.4],
        b: [9.6, 10.8],
        hw: 1.5,
        turns: 2.4,
        t0: 0.12,
        t1: 0.78,
      }, // index
      {
        a: [12.45, 8.4],
        b: [12.6, 12.8],
        hw: 1.38,
        turns: 1.6,
        t0: 0.12,
        t1: 0.82,
      }, // middle
      {
        a: [13.7, 16.9],
        b: [13.7, 20.1],
        hw: 4.1,
        turns: 1.4,
        t0: 0.08,
        t1: 0.92,
      }, // wrist
      {
        a: [16.0, 8.6],
        b: [16.1, 12.8],
        hw: 1.55,
        turns: 1.6,
        t0: 0.12,
        t1: 0.82,
      }, // ring
      {
        a: [4.6, 11.4],
        b: [7.4, 14.6],
        hw: 1.25,
        turns: 1.7,
        t0: 0.1,
        t1: 0.82,
      }, // thumb
      {
        a: [19.3, 9.6],
        b: [19.6, 12.8],
        hw: 1.1,
        turns: 1.4,
        t0: 0.12,
        t1: 0.86,
      }, // pinky
    ];
    const cur = {
      x: -1e4,
      y: -1e4,
      vx: 0,
      vy: 0,
      lx: -1e4,
      ly: -1e4,
      present: false,
      down: false,
      mouse: false,
      t: 0,
    };
    const btn = {
      cx: 0,
      cy: 0,
      hw: 150,
      hh: 30,
      lbw: 72,
      lbh: 18,
      top: 14,
      sink: 5,
      dome: 1.2,
      lift: 0,
      liftV: 0,
      press: 0,
      pressV: 0,
      pressTarget: 0,
      intro: 1,
      introV: 0,
    };
    const pull = { x: 0, y: 0, amt: 0, v: 0 };
    const peak = { x: 0, y: 0, amt: 0, v: 0 };
    let time = 3,
      lastSnap = -1,
      lastSpawn = -1,
      lastMicro = -1,
      nextProbe = time + 5,
      awareNow = 0;
    let labelAmt = 0,
      labelTarget = 0;
    let W = 1,
      H = 1,
      DPR = 1,
      quality = 1;
    let MAXS = 18,
      MAXC = 24; // MAXC: thin filaments (finger wraps + mozzarella fibres)
    const WP = 18; // points per wrap coil

    const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
    const ease = (e0, e1, x) => {
      const t = clamp((x - e0) / (e1 - e0), 0, 1);
      return t * t * (3 - 2 * t);
    };
    const rand = (a, b) => a + Math.random() * (b - a);
    function spring(o, k, kv, target, w, z, dt) {
      o[kv] += (w * w * (target - o[k]) - 2 * z * w * o[kv]) * dt;
      o[k] += o[kv] * dt;
    }

    // ───────────────────────────── WebGL setup ─────────────────────────────
    gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      depth: false,
      stencil: false,
      powerPreference: "default",
    });
    if (!gl) {
      dispose();
      return null;
    }
    const FLOATBUF = !!(
      gl.getExtension("EXT_color_buffer_float") ||
      gl.getExtension("EXT_color_buffer_half_float")
    );
    if (gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) < 900) {
      MAXS = 6;
      MAXC = 3;
    }

    const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

    // Pass 1: vertical (top-down) ray march of the 3D SDF scene → G-buffer (normal.xy, height, material)
    const FRAG_SCENE = `#version 300 es
precision highp float;
precision highp int;
#define MAXS ${MAXS}
#define NP ${NP}
#define MAXB ${MAXB}
#define MAXR ${MAXR}
#define MAXBR ${MAXBR}
#define MAXC ${MAXC}
#define WP ${WP}
${FLOATBUF ? "" : "#define ENC8 1"}

uniform vec2 uRes;
uniform float uDpr;
uniform float uTime;
uniform int uNC;
uniform vec4 uCoil[MAXC * WP]; // goo coils wrapped around the hand (xyz + r)
uniform vec4 uCBox[MAXC];
uniform sampler2D uHandSDF;    // signed distance of the hand icon, in icon units (24-unit frame)
uniform sampler2D uArrowSDF;   // same for the arrow icon
uniform float uMorph;         // 0 = arrow, 1 = hand
uniform vec4 uHand;            // hotspot x, y, px per icon unit, visible
uniform vec4 uHand2;           // cos, sin of tilt, slab centre z, slab half thickness
uniform vec3 uCoat;            // engulf front (px of pill distance), softness, patch threshold
uniform vec4 uBtn;     // cx, cy, half width, half height
uniform vec4 uBtnZ;    // top, sink, dome, flow amplitude
uniform vec4 uBtnZ2;   // lift off the floor, bevel radius
uniform vec4 uPull;    // x, y, amount, sigma
uniform vec4 uPeak;    // x, y, amount, sigma
uniform int uNS;
uniform vec4 uPts[MAXS * NP];  // xyz + radius
uniform vec4 uBox[MAXS];       // strand 2D bounds
uniform vec4 uAnc[MAXS];       // anchor x, y, mound, sigma
uniform vec4 uAncD[MAXS];      // pull direction xy, elongation
uniform int uNBr;
uniform vec4 uBr[MAXBR * 3];   // silk bridges: a, sag midpoint, b (xyz + r)
uniform int uNB;
uniform vec4 uBlob[MAXB];      // x, y, z, r
uniform float uBlobZ[MAXB];    // vertical squash
uniform vec4 uRip[MAXR];       // x, y, age, amp
uniform sampler2D uLabel;
uniform vec4 uLabelBox;
uniform float uEmboss;
uniform float uZTop;
uniform vec3 uK;               // smooth radii: strand-strand, strand-button, blob

out vec4 outG;

uint gMask[MAXS];
uint gCMask[MAXC];
bool gBlob[MAXB];
bool gBr[MAXBR];
bool gHand;
const vec2 HOT = vec2(8.0, 3.0);    // hotspot of the hand icon (index fingertip)
const vec2 HOT_A = vec2(6.1, 0.9);  // hotspot of the arrow icon (its tip)

vec2 iconQ(vec2 p, vec2 hot) {
  vec2 d = p - uHand.xy;
  return vec2(uHand2.x * d.x + uHand2.y * d.y, -uHand2.y * d.x + uHand2.x * d.y) / uHand.z + hot;
}
float iconSdf(sampler2D t, vec2 q) {
  vec2 qc = clamp(q, vec2(0.0), vec2(24.0));
  return textureLod(t, qc / 24.0, 0.0).r + length(q - qc);
}
// the cursor icon as a thin floating slab. Arrow and hand distance fields are blended, so the
// silhouette flows from one shape into the other while both hotspots stay pinned to the pointer
float hand2D(vec2 p) {
  float dh = uMorph > 0.001 ? iconSdf(uHandSDF, iconQ(p, HOT)) : 0.0;
  float da = uMorph < 0.999 ? iconSdf(uArrowSDF, iconQ(p, HOT_A)) : 0.0;
  return mix(da, dh, uMorph) * uHand.z;
}
float sdHand(float h2, float z, float th) {
  return length(vec2(max(h2 + th, 0.0), z - uHand2.z)) - th;
}

float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash12(i), b = hash12(i + vec2(1, 0)), c = hash12(i + vec2(0, 1)), d = hash12(i + vec2(1, 1));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 3.1; a *= 0.5; }
  return s;
}
float smin(float a, float b, float k) { float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }

// 2D pill distance + surface displacement (both depend only on xy, so a vertical ray computes them once)
vec2 button2D(vec2 p) {
  vec2 q = p - uBtn.xy;
  float d = length(vec2(max(abs(q.x) - (uBtn.z - uBtn.w), 0.0), q.y)) - uBtn.w;
  if (d > 110.0) return vec2(d, 0.0);
  float inner = clamp(-d / uBtn.w, 0.0, 1.0);
  float disp = uBtnZ.z * (1.0 - (1.0 - inner) * (1.0 - inner));
  // everything below only lifts the top surface: zero at the outline, so the pill never changes size;
  // the reaching happens through the strands that leave it
  float body = smoothstep(1.0, -14.0, d);
  float lift = 0.0;
  // living surface: a slow, broad swell only, so the pill keeps its shape and reads like poured glass
  float t = uTime;
  vec2 nq = q * 0.008;
  vec2 w = vec2(vnoise(nq + vec2(t * 0.07, -t * 0.05)), vnoise(nq * 1.3 + vec2(-t * 0.06, t * 0.04) + 4.7));
  lift += (vnoise(nq * 1.2 + 1.2 * w) - 0.5) * uBtnZ.w;
  vec2 dp = p - uPull.xy;
  lift += uPull.z * exp(-dot(dp, dp) / (2.0 * uPull.w * uPull.w));
  dp = p - uPeak.xy;
  float rr = dot(dp, dp) / (uPeak.w * uPeak.w);
  lift += uPeak.z / ((1.0 + rr) * (1.0 + rr));
  for (int i = 0; i < MAXS; i++) {
    if (i >= uNS) break;
    vec4 an = uAnc[i];
    if (an.z <= 0.0) continue;
    vec4 ad = uAncD[i];
    dp = p - an.xy;
    float al = dot(dp, ad.xy), ac = dp.x * ad.y - dp.y * ad.x;
    float sl = an.w * (1.0 + ad.z), a0 = an.w * ad.z * 0.7;
    lift += an.z * exp(-ac * ac / (2.0 * an.w * an.w) - (al - a0) * (al - a0) / (2.0 * sl * sl));
  }
  for (int i = 0; i < MAXR; i++) {
    vec4 r = uRip[i];
    if (r.w <= 0.0) continue;
    // melted-rubber settle: one soft swell that spreads and sinks, no rings
    float sg = 12.0 + r.z * 40.0, rd = length(p - r.xy);
    lift += r.w * 0.6 * exp(-rd * rd / (2.0 * sg * sg)) * exp(-r.z * 5.0);
  }
  disp += lift * body;
  if (uEmboss > 0.0) {
    vec2 lu = (p - uLabelBox.xy) / (2.0 * uLabelBox.zw) + 0.5;
    if (lu.x > 0.0 && lu.y > 0.0 && lu.x < 1.0 && lu.y < 1.0) disp += uEmboss * textureLod(uLabel, lu, 2.0).a;
  }
  return vec2(d, disp);
}

// a slab of goo with a tight bevel, so the gloss runs right up to a crisp border; uBtnZ2.x lifts it off the floor
float sdButton(vec2 bd, float z) {
  float hh = 0.5 * (uBtnZ.x + uBtnZ.y), zc = 0.5 * (uBtnZ.x - uBtnZ.y) + uBtnZ2.x;
  float re = min(uBtnZ2.y, hh);
  vec2 w = vec2(bd.x + re, abs(z - zc) - hh + re);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - re - bd.y;
}
float sdSeg(vec3 p, vec4 a, vec4 b) {
  vec3 pa = p - a.xyz, ba = b.xyz - a.xyz;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
  return length(pa - ba * h) - mix(a.w, b.w, h);
}
float sdEll(vec3 p, vec3 r) { float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / max(k1, 1e-5); }

float map(vec3 p, vec2 bd, float h2, out float dB, out float dS, out float dH) {
  dB = sdButton(bd, p.z);
  float ds = 1e5;
  for (int s = 0; s < MAXS; s++) {
    if (s >= uNS) break;
    uint m = gMask[s];
    if (m == 0u) continue;
    float dd = 1e5;
    for (int j = 0; j < NP - 1; j++) {
      if ((m & (1u << uint(j))) == 0u) continue;
      dd = min(dd, sdSeg(p, uPts[s * NP + j], uPts[s * NP + j + 1]));
    }
    ds = smin(ds, dd, uK.x);
  }
  for (int b = 0; b < MAXBR; b++) {
    if (b >= uNBr) break;
    if (!gBr[b]) continue;
    vec4 a = uBr[b * 3], m = uBr[b * 3 + 1], c = uBr[b * 3 + 2];
    ds = smin(ds, min(sdSeg(p, a, m), sdSeg(p, m, c)), uK.x * 0.6);
  }
  for (int b = 0; b < MAXB; b++) {
    if (b >= uNB) break;
    if (!gBlob[b]) continue;
    vec4 bl = uBlob[b];
    ds = smin(ds, sdEll(p - bl.xyz, vec3(bl.w, bl.w, bl.w * uBlobZ[b])), uK.z);
  }
  for (int c = 0; c < MAXC; c++) {
    if (c >= uNC) break;
    uint m = gCMask[c];
    if (m == 0u) continue;
    for (int j = 0; j < WP - 1; j++) {
      if ((m & (1u << uint(j))) == 0u) continue;
      ds = smin(ds, sdSeg(p, uCoil[c * WP + j], uCoil[c * WP + j + 1]), 0.8);
    }
  }
  dH = 1e5;
  if (gHand) {
    dH = sdHand(h2, p.z, uHand2.w);
    // the closer the hand is to the body, the more the goo takes it over: a shell creeps across the
    // icon from whatever is nearest the button (uneven, living front), fully sealing it over the button
    if (uCoat.x > -uCoat.y) {
      // goo blends onto the icon in drifting patches; the threshold keeps most of the icon visible
      float n = 0.6 * vnoise(p.xy * 0.075 + vec2(uTime * 0.55, -uTime * 0.35)) + 0.4 * vnoise(p.xy * 0.16 - vec2(uTime * 0.8, uTime * 0.45));
      float coat = clamp((uCoat.x - bd.x) / uCoat.y, 0.0, 1.0) * smoothstep(uCoat.z, uCoat.z + 0.12, n);
      if (coat > 0.0) {
        float sh = 2.8 * coat - 0.9;
        ds = smin(ds, sdHand(h2 - sh, p.z, uHand2.w + sh), 2.5);
      }
    }
  }
  dS = ds;
  float dg = smin(dB, ds, uK.y);
  if (!gHand) return dg;
  return smin(dg, dH, 1.2);  // goo clings to the icon with a tiny meniscus
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;

  // per-pixel candidate segments: a vertical ray never gets closer than the 2D distance
  for (int s = 0; s < MAXS; s++) {
    gMask[s] = 0u;
    if (s >= uNS) continue;
    vec4 bb = uBox[s];
    if (p.x < bb.x || p.y < bb.y || p.x > bb.z || p.y > bb.w) continue;
    uint m = 0u;
    for (int j = 0; j < NP - 1; j++) {
      vec4 a = uPts[s * NP + j], b = uPts[s * NP + j + 1];
      vec2 pa = p - a.xy, ba = b.xy - a.xy;
      float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
      if (length(pa - ba * h) - max(a.w, b.w) < uK.y + 2.0) m |= (1u << uint(j));
    }
    gMask[s] = m;
  }
  for (int b = 0; b < MAXB; b++) {
    gBlob[b] = false;
    if (b >= uNB) continue;
    gBlob[b] = length(p - uBlob[b].xy) - uBlob[b].w < uK.y + uK.z + 2.0;
  }
  for (int b = 0; b < MAXBR; b++) {
    gBr[b] = false;
    if (b >= uNBr) continue;
    vec2 lo = min(min(uBr[b * 3].xy, uBr[b * 3 + 1].xy), uBr[b * 3 + 2].xy) - uK.x - 3.0;
    vec2 hi = max(max(uBr[b * 3].xy, uBr[b * 3 + 1].xy), uBr[b * 3 + 2].xy) + uK.x + 3.0;
    gBr[b] = all(greaterThan(p, lo)) && all(lessThan(p, hi));
  }
  for (int c = 0; c < MAXC; c++) {
    gCMask[c] = 0u;
    if (c >= uNC) continue;
    vec4 bb = uCBox[c];
    if (p.x < bb.x || p.y < bb.y || p.x > bb.z || p.y > bb.w) continue;
    uint m = 0u;
    for (int j = 0; j < WP - 1; j++) {
      vec4 a = uCoil[c * WP + j], b = uCoil[c * WP + j + 1];
      vec2 pa = p - a.xy, ba = b.xy - a.xy;
      float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
      if (length(pa - ba * h) - max(a.w, b.w) < uK.y + 2.0) m |= (1u << uint(j));
    }
    gCMask[c] = m;
  }
  // icon centre (12,12) sits at offset (4,9) from the hotspot
  vec2 hc = uHand.xy + mat2(uHand2.x, uHand2.y, -uHand2.y, uHand2.x) * (vec2(4.0, 9.0) * uHand.z);
  gHand = uHand.w > 0.5 && length(p - hc) < 17.5 * uHand.z + 4.0;

  vec2 bd = button2D(p);
  float h2 = gHand ? hand2D(p) : 1e5;
  float z = uZTop, minD = 1e5, dB, dS, dH;
  bool hit = false;
  for (int i = 0; i < 64; i++) {
    float d = map(vec3(p, z), bd, h2, dB, dS, dH);
    minD = min(minD, d);
    if (d < 0.02) { hit = true; break; }
    z -= max(d * 0.8, 0.01);
    if (z < 0.0) break;
  }
  if (!hit) {
#ifdef ENC8
    outG = vec4(clamp(minD / 4.0, 0.0, 1.0), 0.0, 0.0, 0.0);
#else
    outG = vec4(minD, 0.0, 0.0, 0.0);
#endif
    return;
  }

  vec3 pos = vec3(p, z);
  const vec2 k = vec2(1.0, -1.0);
  const float e = 0.3;
  float t0, t1, t2;
  vec3 n = k.xyy * map(pos + k.xyy * e, button2D(pos.xy + k.xy * e), gHand ? hand2D(pos.xy + k.xy * e) : 1e5, t0, t1, t2)
         + k.yyx * map(pos + k.yyx * e, button2D(pos.xy + k.yy * e), gHand ? hand2D(pos.xy + k.yy * e) : 1e5, t0, t1, t2)
         + k.yxy * map(pos + k.yxy * e, button2D(pos.xy + k.yx * e), gHand ? hand2D(pos.xy + k.yx * e) : 1e5, t0, t1, t2)
         + k.xxx * map(pos + k.xxx * e, button2D(pos.xy + k.xx * e), gHand ? hand2D(pos.xy + k.xx * e) : 1e5, t0, t1, t2);
  n = normalize(n);
  // material: 0 floor, 1..2 goo (button → strand), 3 hand icon
  float mat = dH < min(dB, dS) - 0.05 ? 3.0 : 1.0 + smoothstep(-1.5, 1.5, dB - dS);
#ifdef ENC8
  outG = vec4(n.xy * 0.5 + 0.5, z / 128.0, mat * 0.25);
#else
  outG = vec4(n.xy, z, mat);
#endif
}`;

    // Pass 2: studio shading, heightfield soft shadows, AO, thin-film sheen, label, tone map
    const FRAG_SHADE = `#version 300 es
precision highp float;
${FLOATBUF ? "" : "#define ENC8 1"}
uniform sampler2D uG;
uniform sampler2D uLabel;
uniform vec2 uRes;
uniform float uDpr;
uniform float uTime;
uniform vec4 uLabelBox;
uniform float uLabelAmt;
uniform float uLabelLod;
uniform float uIri;
uniform float uZMax;
uniform float uLift;
uniform vec4 uBtnP;   // button centre and half size, for the face's planar reflection
uniform vec2 uWin;    // window reflection centre x and half width, in button half-widths
uniform vec2 uBtnH;   // button top height and current lift, px (for its floor shadow)
uniform sampler2D uHandCol;
uniform sampler2D uArrowCol;
uniform float uMorph;
uniform vec4 uHand;
uniform vec4 uHand2;
out vec4 outC;

vec3 KEY;

vec4 dec(vec4 g) {
#ifdef ENC8
  if (g.a < 0.1) return vec4(g.r * 4.0, 0.0, 0.0, 0.0);
  return vec4(g.rg * 2.0 - 1.0, g.b * 128.0, g.a * 4.0);
#else
  return g;
#endif
}
float decH(vec4 g) {
#ifdef ENC8
  return g.b * 128.0;
#else
  return g.b;
#endif
}
vec2 uvOf(vec2 p) { return vec2(p.x * uDpr / uRes.x, 1.0 - p.y * uDpr / uRes.y); }
vec4 gAt(ivec2 c) { return dec(texelFetch(uG, clamp(c, ivec2(0), ivec2(uRes) - 1), 0)); }
float hAt(vec2 p, float lod) { return decH(textureLod(uG, uvOf(p), lod)); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }

float softShadow(vec2 p, float h0) {
  vec2 L2 = normalize(KEY.xy);
  float tanE = KEY.z / length(KEY.xy);
  float res = 1.0, s = 1.0;
  for (int i = 0; i < 28; i++) {
    float zr = h0 + s * tanE;
    if (zr > uZMax) break;
    float hgt = hAt(p + L2 * s, log2(1.0 + s * 0.08 * uDpr));
    res = min(res, (1.5 - 0.7 * uLift) * (zr - hgt) / s);
    if (res < -0.2) break;
    s += 0.8 + s * 0.14;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}
float occlusion(vec2 p, float h) {
  vec2 uv = uvOf(p);
  float o = 0.0;
  o += 0.50 * clamp((decH(textureLod(uG, uv, log2(6.0 * uDpr))) - h) / 9.0, 0.0, 1.0);
  o += 0.32 * clamp((decH(textureLod(uG, uv, log2(20.0 * uDpr))) - h) / 26.0, 0.0, 1.0);
  o += 0.26 * clamp((decH(textureLod(uG, uv, log2(60.0 * uDpr))) - h) / 60.0, 0.0, 1.0);
  return clamp(1.0 - o, 0.0, 1.0);
}
bool isNear(vec2 p) {
  float l = log2(96.0 * uDpr);
  float m = max(max(hAt(p + vec2(48.0, 48.0), l), hAt(p + vec2(-48.0, 48.0), l)),
                max(hAt(p + vec2(48.0, -48.0), l), hAt(p + vec2(-48.0, -48.0), l)));
  return max(m, hAt(p, l)) > 0.02;
}

float softbox(vec3 R, vec3 c, vec2 size, float edge) {
  float cd = dot(R, c);
  if (cd <= 0.0) return 0.0;
  vec3 t1 = normalize(cross(c, vec3(0.0, 0.0, 1.0)));
  vec3 t2 = cross(t1, c);
  vec2 q = abs(vec2(dot(R, t1), dot(R, t2)) / cd) / size;
  return (1.0 - smoothstep(edge, 1.0, q.x)) * (1.0 - smoothstep(edge, 1.0, q.y)) * (0.85 + 0.15 * (1.0 - q.y));
}
float vn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
// a living room up and to the left, where the key light comes from: a daylight window with mullions and a
// tree line, a warm wall and a lamp around it. Slightly saturated so the goo feels like it sits in a real
// place; outside this patch of the sky everything stays studio black
vec3 room(vec3 R) {
  vec3 c = normalize(vec3(-0.34, -0.42, 0.84));
  float cd = dot(R, c);
  if (cd <= 0.2) return vec3(0.0);
  vec3 t1 = normalize(cross(c, vec3(0.0, 0.0, 1.0)));
  vec3 t2 = cross(t1, c);                       // points up the wall
  vec2 w = vec2(dot(R, t1), dot(R, t2)) / cd / vec2(0.34, 0.28); // window space: |w| < 1 is glass
  float wallMask = 1.0 - smoothstep(1.3, 2.3, length(w * vec2(0.8, 1.0)));
  vec3 col = vec3(0.92, 0.78, 0.6) * 0.3 * wallMask;                        // warm plaster
  float shelf = smoothstep(-2.3, -2.2, w.y) * (1.0 - smoothstep(-1.35, -1.25, w.y));
  col = mix(col, vec3(0.3, 0.18, 0.1) * 0.5, shelf * wallMask);             // walnut sideboard
  vec2 lp = w - vec2(1.75, -0.55);
  col += vec3(1.0, 0.7, 0.4) * 5.0 * exp(-dot(lp, lp) / 0.05);              // lamp
  vec2 aw = abs(w);
  float glass = (1.0 - smoothstep(0.94, 1.0, aw.x)) * (1.0 - smoothstep(0.94, 1.0, aw.y));
  if (glass > 0.0) {
    float v = w.y * 0.5 + 0.5;
    vec3 sky = mix(vec3(1.0, 0.92, 0.8), vec3(0.6, 0.76, 1.0), smoothstep(0.2, 1.0, v)) * 16.0;
    float line = 0.3 + 0.16 * vn(vec2(w.x * 4.0, 3.1)) + 0.07 * vn(vec2(w.x * 11.0, 7.3));
    float tree = 1.0 - smoothstep(line - 0.03, line + 0.03, v);
    vec3 green = mix(vec3(0.16, 0.3, 0.12), vec3(0.32, 0.45, 0.2), vn(w * 9.0)) * 3.0;
    vec3 view = mix(sky, green, tree);
    float mull = max(1.0 - smoothstep(0.025, 0.05, aw.x), 1.0 - smoothstep(0.025, 0.05, abs(w.y - 0.1)));
    view = mix(view, vec3(0.85, 0.8, 0.72) * 0.6, mull);                    // window frame
    col = mix(col, view, glass);
  }
  return col;
}

// black-product studio: flags absorb everything, so the body stays jet black and the only
// reflections are shaped sources that describe the form
vec3 env(vec3 R) {
  vec2 rd = normalize(R.xy + vec2(1e-5));
  float keySide = 0.5 + 0.5 * dot(rd, normalize(KEY.xy));
  // white floor seen at grazing angles: a faint bounce that dies out quickly under the goo
  if (R.z < 0.0) return mix(vec3(0.14) * keySide, vec3(0.0015), smoothstep(0.0, -0.22, R.z));
  vec3 c = vec3(0.0015);
  // the room reflection up and to the left replaces the plain key window
  c += room(R);
  // low strip lights left and right: thin rim lines that trace the contour of the caps and strands
  c += vec3(1.0) * 7.0 * softbox(R, normalize(vec3(-0.96, 0.08, 0.2)), vec2(0.75, 0.035), 0.7);
  c += vec3(1.0) * 5.0 * softbox(R, normalize(vec3(0.95, -0.12, 0.24)), vec2(0.75, 0.035), 0.7);
  // small high kicker bottom right: a second, smaller specular so curves read as round
  c += vec3(1.0) * 5.0 * softbox(R, normalize(vec3(0.45, 0.55, 0.75)), vec2(0.07, 0.07), 0.5);
  // very dim broad top fill: just enough gradient on the dome to feel curved, never a line
  c += vec3(0.1) * softbox(R, normalize(vec3(0.12, 0.25, 1.0)), vec2(0.8, 0.55), 0.2);
  // white cyc glimpsed only at the very edge: a hairline, not a stripe
  float wall = 1.0 - smoothstep(0.0, 0.1, R.z);
  c += vec3(0.28) * wall * wall * keySide * keySide * keySide;
  return c;
}

// the label is a separate, flat layer of polished silver laid on top of the goo. It is shaded on its own,
// never through the goo's normals, so the letters cannot warp; only their stamped edges catch the light
vec3 shadeLabel(vec2 lu, float sh, float ao) {
  vec2 tx = vec2(2.5 / 1024.0, 2.5 / 256.0);
  float mx = textureLod(uLabel, lu + vec2(tx.x, 0.0), uLabelLod).a - textureLod(uLabel, lu - vec2(tx.x, 0.0), uLabelLod).a;
  float my = textureLod(uLabel, lu + vec2(0.0, tx.y), uLabelLod).a - textureLod(uLabel, lu - vec2(0.0, tx.y), uLabelLod).a;
  vec3 N = normalize(vec3(-mx * 1.1, -my * 1.1, 1.0));
  vec3 R = reflect(vec3(0.0, 0.0, -1.0), N);
  vec3 silver = vec3(0.9, 0.96, 1.0);
  // polished silver: the classic chrome profile across the letter height (bright sky on top, a darker
  // horizon band through the middle, a lighter floor bounce at the bottom)
  float t = clamp((lu.y - 0.32) / 0.36, 0.0, 1.0);
  float grad = t < 0.48 ? mix(1.04, 0.92, smoothstep(0.0, 0.48, t))
                        : mix(0.88, 1.0, smoothstep(0.5, 1.0, t));
  vec3 col = silver * grad * (0.82 + 0.18 * sh);
  col += env(R) * silver * 0.08;                                             // a restrained cool bevel
  // stamped edge: a crisp lit rim on the side facing the key light, a darker one opposite
  float edge = clamp(length(vec2(mx, my)) * 1.6, 0.0, 1.0);
  float facing = dot(normalize(vec2(mx, my) + 1e-5), normalize(KEY.xy));
  col *= 1.0 - 0.25 * edge * smoothstep(0.0, 0.8, -facing);
  col += vec3(1.0) * 0.55 * edge * smoothstep(0.1, 0.9, facing);
  vec3 Hh = normalize(KEY + vec3(0.0, 0.0, 1.0));
  float NdH = max(dot(N, Hh), 0.0), a2 = 0.01;
  col += vec3(1.0) * a2 / (3.14159 * pow(NdH * NdH * (a2 - 1.0) + 1.0, 2.0)) * 0.05 * sh;
  return col * mix(0.85, 1.0, ao);
}

// window reflected in the button face, in button space (x / half width, y / half height, y down).
// Out of focus, like a real reflection in matte rubber: no hard frame or fine detail, just soft
// sky, a blurred tree line and the shadow of the sash, dissolving toward its edges
vec3 faceWindow(vec2 b) {
  vec2 w = vec2((b.x - uWin.x + b.y * 0.08) / uWin.y, (b.y + 0.3) / 1.15);
  float fade = 1.0 - smoothstep(0.2, 1.05, length(w * vec2(0.85, 0.8)));
  if (fade <= 0.0) return vec3(0.0);
  float v = 0.5 - 0.5 * w.y;                                     // 1 toward the top of the window
  vec3 sky = mix(vec3(0.18, 0.32, 0.52), vec3(0.42, 0.7, 0.94), smoothstep(0.2, 1.0, v));
  float line = 0.36 + 0.1 * vn(vec2(w.x * 1.6, 2.0));
  float tree = 1.0 - smoothstep(line - 0.2, line + 0.2, v);
  vec3 view = mix(sky, vec3(0.025, 0.055, 0.12), tree * 0.85);
  float sash = 1.0 - smoothstep(0.04, 0.26, abs(w.y + 0.1));
  float stile = 1.0 - smoothstep(0.05, 0.3, abs(w.x));
  view *= 1.0 - 0.5 * max(sash, stile * 0.6);
  return view * 0.09 * fade;
}

vec3 shadeGoo(vec2 p, vec4 g) {
  vec3 N = vec3(g.xy, sqrt(max(1e-4, 1.0 - dot(g.xy, g.xy))));
  float strandness = clamp(g.w - 1.0, 0.0, 1.0);
  vec3 V = vec3(0.0, 0.0, 1.0);
  float NdV = clamp(N.z, 0.03, 1.0);
  vec3 R = reflect(-V, N);
  float F = 0.04 + 0.96 * pow(1.0 - NdV, 5.0);
  float sh = softShadow(p, g.z + 0.6);
  float ao = occlusion(p, g.z);

  // reflections disperse a little: red and blue sample the room from slightly different angles,
  // so window edges and highlights carry thin colour fringes
  vec3 dN = vec3(N.xy, 0.0) * 0.07 + vec3(0.012, 0.008, 0.0);
  vec3 spec = vec3(env(normalize(R + dN)).r, env(R).g, env(normalize(R - dN)).b) * F * mix(0.5, 1.0, min(sh, ao));
  spec *= vec3(0.45, 0.7, 0.95) * 0.7;
  // oily thin-film sheen, biased toward Venom blue / violet
  // cool sheen only (blue → violet), so the rim never picks up warm orange/red fringes
  float fr = pow(1.0 - NdV, 2.0);
  vec3 film = mix(vec3(0.8, 0.88, 1.12), vec3(0.9, 0.86, 1.1), 0.5 + 0.5 * sin((1.0 - NdV) * 9.0));
  spec *= mix(vec3(1.0), film, uIri * fr);
  // tight key sparkle
  vec3 Hh = normalize(KEY + V);
  float NdH = max(dot(N, Hh), 0.0), a2 = 0.0025;
  float D = a2 / (3.14159 * pow(NdH * NdH * (a2 - 1.0) + 1.0, 2.0));
  spec += vec3(0.5, 0.75, 1.0) * D * F * 0.3 * sh;

  // the button's face is matte rubber: a broad soft sheen and a soft glow from the room, no mirror
  // reflections. Tendrils (strandness → 1) keep the glossy goo look
  float matte = (1.0 - strandness) * 0.92;
  float ar2 = 0.16;
  float Dr = ar2 / (3.14159 * pow(NdH * NdH * (ar2 - 1.0) + 1.0, 2.0));
  vec3 cRoom = normalize(vec3(-0.34, -0.42, 0.84));
  vec3 rough = vec3(0.55, 0.78, 1.0) * Dr * F * 0.05 * sh
             + vec3(0.4, 0.65, 0.9) * pow(max(dot(R, cRoom), 0.0), 10.0) * F * 0.65;
  spec = mix(spec, rough, matte);

  vec3 diff = vec3(0.001, 0.0025, 0.006) * (1.8 * max(dot(N, KEY), 0.0) * sh + 0.9 * ao);
  vec3 col = diff + spec;

  // the living-room window as a flat, planar reflection on the face (top left): it only bends where the
  // bevel curves, so the face reads as a flat sheet of rubber, not a blob of water
  vec2 bq = (p - uBtnP.xy) / uBtnP.zw + N.xy * 1.6;
  vec2 dsp = normalize(bq - vec2(uWin.x, -0.3) + 1e-4) * 0.02;
  vec3 win = vec3(faceWindow(bq + dsp).r, faceWindow(bq).g, faceWindow(bq - dsp).b);
  col += win * matte * mix(0.6, 1.0, ao);

  // rim light along the bevel: cool from the window side (top left), a softer blue kicker from the
  // bottom right, and a slow glint that travels around the contour so the edge catches and shines
  float bevel = 1.0 - smoothstep(0.3, 0.86, N.z);
  vec2 nd = normalize(N.xy + 1e-5);
  float rimL = pow(max(dot(nd, vec2(-0.6, -0.8)), 0.0), 2.0);
  float rimR = pow(max(dot(nd, vec2(0.8, 0.6)), 0.0), 3.0) * 0.55;
  vec2 cq = (p - uBtnP.xy) / uBtnP.zw;
  float glint = pow(0.5 + 0.5 * cos(atan(cq.y, cq.x) - uTime * 0.9), 28.0);
  vec3 rimC = vec3(0.35, 0.68, 0.95) * rimL + vec3(0.22, 0.45, 0.75) * rimR + vec3(0.65, 0.85, 1.0) * glint * 0.65;
  col += rimC * bevel * 0.35 * (1.0 - strandness) * mix(0.7, 1.0, sh);

  if (uLabelAmt > 0.0) {
    vec2 lu = (p - uLabelBox.xy) / (2.0 * uLabelBox.zw) + 0.5;
    if (lu.x > 0.0 && lu.y > 0.0 && lu.x < 1.0 && lu.y < 1.0) {
      float m = textureLod(uLabel, lu, uLabelLod).a * (1.0 - smoothstep(0.15, 0.5, strandness)) * uLabelAmt;
      if (m > 0.002) col = mix(col, shadeLabel(lu, sh, ao), m);
    }
  }
  return col;
}

// the Figma hand icon: its own white fill + black outline, lit like a glossy vinyl decal
vec3 shadeHand(vec2 p, vec4 g) {
  vec3 N = vec3(g.xy, sqrt(max(1e-4, 1.0 - dot(g.xy, g.xy))));
  vec2 d = p - uHand.xy;
  vec2 r = vec2(uHand2.x * d.x + uHand2.y * d.y, -uHand2.y * d.x + uHand2.x * d.y) / uHand.z;
  vec4 tc = mix(textureLod(uArrowCol, clamp((r + vec2(6.1, 0.9)) / 24.0, 0.0, 1.0), 0.0),
                textureLod(uHandCol, clamp((r + vec2(8.0, 3.0)) / 24.0, 0.0, 1.0), 0.0), uMorph);
  vec3 alb = pow(mix(vec3(0.0), tc.rgb, smoothstep(0.2, 0.8, tc.a)), vec3(2.2)) * 0.86 + 0.012;
  float sh = softShadow(p, g.z + 0.6);
  float ao = occlusion(p, g.z);
  vec3 R = reflect(vec3(0.0, 0.0, -1.0), N);
  float F = 0.04 + 0.96 * pow(1.0 - clamp(N.z, 0.03, 1.0), 5.0);
  vec3 Hh = normalize(KEY + vec3(0.0, 0.0, 1.0));
  float NdH = max(dot(N, Hh), 0.0), a2 = 0.004;
  float D = a2 / (3.14159 * pow(NdH * NdH * (a2 - 1.0) + 1.0, 2.0));
  // glazed like glass: crisp studio reflections and a tight key sparkle over the icon's own colours
  return alb * (1.2 * max(dot(N, KEY), 0.0) * sh + 0.9 * ao) + env(R) * F * 1.15 * mix(0.6, 1.0, sh) + vec3(0.95) * D * F * 0.5 * sh;
}
vec3 shadeAny(vec2 p, vec4 g) { return g.w > 2.5 ? shadeHand(p, g) : shadeGoo(p, g); }

float sdPill(vec2 q, vec2 b) { return length(vec2(max(abs(q.x) - (b.x - b.y), 0.0), q.y)) - b.y; }
// the button's shadow on the white floor, layered like a studio product shot: a tight contact crease at
// the base, a soft cast shadow pushed away from the key light, and a wide faint ambient spread.
// Lifting the button fades the crease and pushes the cast shadow further out and softer
float buttonShadow(vec2 p) {
  // how a real object shades the surface it rests on: darkest right at the base (light can't get
  // under it), falling off smoothly and continuously with distance, pushed toward the lower right
  // away from the key light, with a faint wide ambient fade. Lifting thins the contact out
  vec2 q = p - uBtnP.xy;
  float d0 = max(sdPill(q, uBtnP.zw), 0.0);
  float lift = uBtnH.y, h = uBtnH.x + lift;
  vec2 off = -normalize(KEY.xy) * (h * 0.38 + lift * 0.45);
  float d1 = max(sdPill(q - off, uBtnP.zw - vec2(1.0)), 0.0);
  float grounded = 1.0 - smoothstep(0.0, 12.0, lift);
  float contact = exp(-d0 / (2.2 + lift * 0.4)) * 0.62 * grounded;           // tight dark crease
  float occl = exp(-d0 / 7.0) * 0.3 * mix(0.45, 1.0, grounded);             // near-field occlusion
  float dropSh = exp(-d1 / (8.0 + h * 0.25 + lift * 0.6)) * (0.34 - 0.08 * (1.0 - grounded)); // soft key shadow
  float ambient = exp(-d0 / 34.0) * 0.12;                                     // wide skylight fade
  float lit = (1.0 - contact) * (1.0 - occl) * (1.0 - dropSh) * (1.0 - ambient);
  return clamp(1.0 - lit, 0.0, 0.88);
}

vec3 floorShade(vec2 p) {
  float sh = 1.0, ao = 1.0;
  if (isNear(p)) { sh = softShadow(p, 0.0); ao = mix(occlusion(p, 0.0), 1.0, 0.55 * uLift); } // lifted: no contact crease
  vec2 v = p / (uRes / uDpr);
  float falloff = 1.0 - 0.08 * length(v - vec2(0.32, 0.22));
  vec3 alb = vec3(0.86, 0.865, 0.875);
  vec3 lit = alb * (vec3(1.0, 0.985, 0.96) * 1.3 * KEY.z * sh + vec3(0.92, 0.95, 1.0) * 1.2 * ao) * falloff;
  return lit * (1.0 - buttonShadow(p) * vec3(0.96, 0.94, 0.9)); // shadows stay a touch cool, like skylight fill
}

vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main() {
  KEY = normalize(vec3(-0.45, -0.56, 0.74));
  ivec2 c = ivec2(gl_FragCoord.xy);
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec4 g = gAt(c);
  vec3 col;
  float alpha = 1.0;
  if (g.w < 0.5) {
    float cov = clamp(0.5 - g.x * uDpr, 0.0, 1.0);
    float shadow = buttonShadow(p);
    if (isNear(p)) shadow = max(shadow, (1.0 - softShadow(p, 0.0)) * 0.35);
    alpha = mix(shadow, 1.0, cov);
    vec4 n0 = gAt(c + ivec2(1, 0)), n1 = gAt(c - ivec2(1, 0)), n2 = gAt(c + ivec2(0, 1)), n3 = gAt(c - ivec2(0, 1));
    vec4 gn = n0.w > 0.5 ? n0 : n1.w > 0.5 ? n1 : n2.w > 0.5 ? n2 : n3;
    col = cov > 0.0 && gn.w > 0.5 ? shadeAny(p, gn) : vec3(0.0);
    col = pow(aces(col * 0.95), vec3(1.0 / 2.2)) * cov;
  } else {
    col = pow(aces(shadeAny(p, g) * 0.95), vec3(1.0 / 2.2));
    col += (hash12(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 255.0;
  }
  outC = vec4(col, alpha);
}`;

    function compile(type, src) {
      const sh = own("Shader", gl.createShader(type));
      gl.shaderSource(sh, src.trim());
      gl.compileShader(sh);
      return sh;
    }
    const programs = [];
    const vertex = compile(gl.VERTEX_SHADER, VERT);
    const parallelCompile = gl.getExtension("KHR_parallel_shader_compile");
    let programsReady = false;
    function program(fs, names) {
      const prog = own("Program", gl.createProgram());
      gl.attachShader(prog, vertex);
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(prog);
      const result = { prog, u: {}, names };
      programs.push(result);
      return result;
    }
    function finishPrograms() {
      // Submit every shader first; the extension lets later frames poll without a stall.
      if (
        parallelCompile &&
        programs.some(
          ({ prog }) =>
            !gl.getProgramParameter(
              prog,
              parallelCompile.COMPLETION_STATUS_KHR,
            ),
        )
      )
        return false;
      for (const { prog, u, names } of programs) {
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
          throw new Error(gl.getProgramInfoLog(prog));
        for (const name of names) u[name] = gl.getUniformLocation(prog, name);
      }
      return true;
    }
    const p1 = program(FRAG_SCENE, [
      "uArrowSDF",
      "uMorph",
      "uCoat",
      "uNC",
      "uCoil",
      "uCBox",
      "uHandSDF",
      "uHand",
      "uHand2",
      "uRes",
      "uDpr",
      "uTime",
      "uBtn",
      "uBtnZ",
      "uBtnZ2",
      "uPull",
      "uPeak",
      "uNS",
      "uPts",
      "uBox",
      "uAnc",
      "uAncD",
      "uNBr",
      "uBr",
      "uNB",
      "uBlob",
      "uBlobZ",
      "uRip",
      "uLabel",
      "uLabelBox",
      "uEmboss",
      "uZTop",
      "uK",
    ]);
    const p2 = program(FRAG_SHADE, [
      "uG",
      "uLabel",
      "uRes",
      "uDpr",
      "uTime",
      "uLabelBox",
      "uLabelAmt",
      "uLabelLod",
      "uIri",
      "uZMax",
      "uLift",
      "uBtnP",
      "uWin",
      "uBtnH",
      "uHandCol",
      "uArrowCol",
      "uMorph",
      "uHand",
      "uHand2",
    ]);

    // ── icon textures (arrow + hand): colour (for shading) + signed distance field (for the 3D slab)
    const handColTex = own("Texture", gl.createTexture()),
      handSdfTex = own("Texture", gl.createTexture());
    const arrowColTex = own("Texture", gl.createTexture()),
      arrowSdfTex = own("Texture", gl.createTexture());
    let iconsLoaded = 0;
    function buildIcon(name, colTex, sdfTex) {
      prepareVenomAssets()
        .then((icons) => {
          if (disposed) return;
          const { color, distance, size } = icons[name];
          gl.bindTexture(gl.TEXTURE_2D, colTex);
          gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            color,
          );
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MIN_FILTER,
            gl.LINEAR_MIPMAP_LINEAR,
          );
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

          gl.bindTexture(gl.TEXTURE_2D, sdfTex);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.R16F,
            size,
            size,
            0,
            gl.RED,
            gl.FLOAT,
            distance,
          );
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          if (++iconsLoaded === 2) hand.ready = true;
        })
        .catch(dispose);
    }
    buildIcon("hand", handColTex, handSdfTex);
    buildIcon("arrow", arrowColTex, arrowSdfTex);
    const vao = own("VertexArray", gl.createVertexArray());

    // Pass 3: FXAA, smooths silhouettes, the hand outline and specular sparkle on thin strands
    const FRAG_FXAA = `#version 300 es
precision highp float;
uniform sampler2D uC;
uniform vec2 uRes;
out vec4 outC;
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
void main() {
  vec2 px = 1.0 / uRes, uv = gl_FragCoord.xy * px;
  vec4 rgbaM = texture(uC, uv); vec3 cM = rgbaM.rgb;
  float lNW = luma(texture(uC, uv + vec2(-1.0, -1.0) * px).rgb), lNE = luma(texture(uC, uv + vec2(1.0, -1.0) * px).rgb);
  float lSW = luma(texture(uC, uv + vec2(-1.0, 1.0) * px).rgb), lSE = luma(texture(uC, uv + vec2(1.0, 1.0) * px).rgb);
  float lM = luma(cM);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  if (lMax - lMin < max(0.03, lMax * 0.08)) { outC = rgbaM; return; }
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
  float reduce = max((lNW + lNE + lSW + lSE) * 0.03125, 1.0 / 128.0);
  dir = clamp(dir / (min(abs(dir.x), abs(dir.y)) + reduce), -8.0, 8.0) * px;
  vec4 A = 0.5 * (texture(uC, uv - dir / 6.0) + texture(uC, uv + dir / 6.0));
  vec4 B = A * 0.5 + 0.25 * (texture(uC, uv - dir * 0.5) + texture(uC, uv + dir * 0.5));
  float lB = luma(B.rgb);
  outC = (lB < lMin || lB > lMax) ? A : B;
}`;
    const p3 = program(FRAG_FXAA, ["uC", "uRes"]);
    let cTex = null;
    const cFbo = own("Framebuffer", gl.createFramebuffer());

    let gTex = null;
    const fbo = own("Framebuffer", gl.createFramebuffer());
    function makeGBuffer() {
      if (gTex) release("Texture", gTex);
      gTex = own("Texture", gl.createTexture());
      gl.bindTexture(gl.TEXTURE_2D, gTex);
      const levels = Math.floor(Math.log2(Math.max(W, H))) + 1;
      gl.texStorage2D(
        gl.TEXTURE_2D,
        levels,
        FLOATBUF ? gl.RGBA16F : gl.RGBA8,
        W,
        H,
      );
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        gTex,
        0,
      );
      if (cTex) release("Texture", cTex);
      cTex = own("Texture", gl.createTexture());
      gl.bindTexture(gl.TEXTURE_2D, cTex);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, W, H);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, cFbo);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        cTex,
        0,
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    // ───────────────────────────── label (SVG → mask texture) ─────────────────────────────
    const LABEL_W = 1024,
      LABEL_H = 256;
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = LABEL_W;
    labelCanvas.height = LABEL_H;
    const lctx = labelCanvas.getContext("2d");
    const labelTex = own("Texture", gl.createTexture());
    gl.bindTexture(gl.TEXTURE_2D, labelTex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(4),
    );

    function uploadLabel() {
      gl.bindTexture(gl.TEXTURE_2D, labelTex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        labelCanvas,
      );
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        gl.LINEAR_MIPMAP_LINEAR,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    async function setLabelText(text) {
      await fontReady;
      if (disposed) return;
      lctx.clearRect(0, 0, LABEL_W, LABEL_H);
      lctx.font = `${font.fontWeight} ${LABEL_PX}px ${font.fontFamily}`;
      lctx.fillStyle = "white";
      lctx.textAlign = "center";
      lctx.textBaseline = "alphabetic";
      const m = lctx.measureText(text);
      lctx.fillText(
        text,
        LABEL_W / 2,
        LABEL_H / 2 +
          (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2,
      );
      labelInkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      uploadLabel();
      labelAmt = 1;
      labelTarget = 1;

      layoutButton();
    }
    setLabelText(LABEL_TEXT).catch(dispose);

    // ───────────────────────────── geometry helpers ─────────────────────────────
    function geo() {
      const e = btn.intro,
        pr = btn.press;
      return {
        cx: btn.cx,
        cy: btn.cy,
        hw: btn.hh * 0.5 + (btn.hw - btn.hh * 0.5) * e + 2.5 * pr,
        hh: btn.hh * (0.55 + 0.45 * e) + 1 * pr,
        top: Math.max(1, btn.top * e * (1 - 0.3 * pr)),
      };
    }
    // nearest point on the pill boundary (optionally inset), outward normal, signed distance
    function pillEdge(x, y, g, inset = 0) {
      const a = g.hw - g.hh;
      const ax = clamp(x - g.cx, -a, a);
      let dx = x - g.cx - ax,
        dy = y - g.cy;
      let L = Math.hypot(dx, dy);
      if (L < 1e-3) {
        dx = 0;
        dy = -1;
        L = 1e-3;
      } else {
        dx /= L;
        dy /= L;
      }
      const R = g.hh - inset;
      return {
        x: g.cx + ax + dx * R,
        y: g.cy + dy * R,
        nx: dx,
        ny: dy,
        d: L - g.hh,
      };
    }
    function anchorFor(px, py, lat, g) {
      const e = pillEdge(px, py, g);
      return pillEdge(
        e.x - e.ny * lat - e.nx * 4,
        e.y + e.nx * lat - e.ny * 4,
        g,
        10,
      );
    }
    function addRipple(x, y, amp) {
      if (reduced) return;
      ripples.push({ x, y, age: 0, amp });
      if (ripples.length > MAXR) ripples.shift();
    }

    // ───────────────────────────── tendrils ─────────────────────────────
    function newStrand(kind, g, ax, ay) {
      const s = {
        kind,
        state: "grow",
        pin: "anchor",
        lx: (ax - g.cx) / g.hw,
        ly: (ay - g.cy) / g.hh,
        pos: new Float32Array(NP * 3),
        prev: new Float32Array(NP * 3),
        rad: new Float32Array(NP).fill(2),
        // second-order dynamics for the lunge: slight wind-up (r < 0), then an overshooting latch
        u: 0,
        ud: 0,
        uKick: true,
        rest: 1,
        vol: 0,
        stretch: 1,
        pinch: 0,
        len: 0,
        neckS: rand(0.42, 0.62),
        side: Math.random() < 0.5 ? -1 : 1,
        wig: rand(0.5, 1.2),
        phase: rand(0, 100),
        snapMul: rand(0.85, 1.15),
        lenMul: rand(0.88, 1.12),
        wrap: null,
        lat: 0,
        life: 0,
        ttl: 0,
        probe: null,
        mound: 0,
        dead: false,
        retract: 0,
      };
      const z = Math.max(2, g.top - 4) + btn.lift * LIFT_H;
      const e = pillEdge(ax, ay, g);
      for (let i = 0; i < NP; i++) {
        const o = i * 3;
        s.pos[o] = s.prev[o] = ax + e.nx * i * 0.4;
        s.pos[o + 1] = s.prev[o + 1] = ay + e.ny * i * 0.4;
        s.pos[o + 2] = s.prev[o + 2] = z;
      }
      return s;
    }

    function spawnReach(g) {
      if (strands.length >= MAXS - 1) return;
      const k = strands.filter(
        (s) => s.kind === "reach" && s.pin === "anchor" && s.state !== "recoil",
      ).length;
      const lat = [0, 30, -30, 58, -58, 82, -82][k % 7] + rand(-6, 6);
      const a = anchorFor(cur.x, cur.y, lat, g);
      const s = newStrand("reach", g, a.x, a.y);
      s.lat = lat;
      s.vol = Math.PI * 1.25 * 1.25 * 170;
      // each tendril claims its own wrap site on the hand (index, middle, wrist, ring, thumb, pinky)
      const taken = new Set(strands.filter((o) => o.wrap).map((o) => o.wrap.f));
      let f = 0;
      while (taken.has(f) && f < FINGERS.length - 1) f++;
      s.wrap = {
        f,
        prog: 0,
        th0: null,
        dir: 1,
        ph: rand(0, 6.28),
        slide: 0,
        r: 0.7,
      };
      strands.push(s);
    }

    // ── hand space: icon units (24-unit frame, hotspot at the index fingertip) → world px
    function handToWorld(ix, iy) {
      const dx = (ix - 8) * hand.s,
        dy = (iy - 3) * hand.s,
        c = Math.cos(hand.ang),
        sn = Math.sin(hand.ang);
      return [
        cur.x + hand.ox + c * dx - sn * dy,
        cur.y + hand.oy + sn * dx + c * dy,
      ];
    }
    const handTh = () => 0.8 * hand.s; // half thickness of the floating icon slab
    // point on a wrap coil, f = 0 where the tendril arrives. The coil is an elliptical helix around the
    // finger axis: crossings with sin(θ) > 0 pass over the icon, the rest tuck underneath it
    const cp = [0, 0, 0, 0];
    function coilPoint(s, f, hair) {
      const w = s.wrap,
        F = FINGERS[w.f];
      const A = handToWorld(F.a[0], F.a[1]),
        B = handToWorld(F.b[0], F.b[1]);
      let ux = B[0] - A[0],
        uy = B[1] - A[1];
      const L = Math.hypot(ux, uy) || 1;
      ux /= L;
      uy /= L;
      const nx = -uy,
        ny = ux;
      if (w.th0 === null) {
        // arrive on the side facing the tendril, first crossing goes over the top
        const side =
          (s.pos[0] - (A[0] + B[0]) / 2) * nx +
          (s.pos[1] - (A[1] + B[1]) / 2) * ny;
        w.th0 = side > 0 ? 0 : Math.PI;
        w.dir = side > 0 ? 1 : -1;
      }
      const r = (hair ? 0.45 : w.r) * P.thickness;
      const phi = f * F.turns * (hair ? 1.25 : 1) * 2 * Math.PI * w.prog;
      const t = clamp(
        F.t0 +
          w.slide +
          ((F.t1 - F.t0) * phi) / (F.turns * 2 * Math.PI * (hair ? 1.1 : 1)),
        0.02,
        0.98,
      );
      const th = w.th0 + w.dir * phi;
      const hw = F.hw * hand.s + r + 0.35,
        zr = handTh() + r + 0.3;
      cp[0] = A[0] + ux * t * L + nx * Math.cos(th) * hw;
      cp[1] = A[1] + uy * t * L + ny * Math.cos(th) * hw;
      cp[2] = CURZ + Math.sin(th) * zr;
      cp[3] = r * (1 - 0.35 * f * f);
      return cp;
    }
    function coilStart(s) {
      const p = coilPoint(s, 0, false);
      return [p[0], p[1], p[2]];
    }

    // tiny surface strings: the whole facing surface reacts, sprouting short pointed strands that lean
    // toward the cursor and sway, never latching on
    function spawnMicro(g) {
      if (strands.length >= MAXS - 6) return; // keep room for real tendrils and their snapped pieces
      const lat = rand(-1, 1) * 75;
      const a = anchorFor(cur.x, cur.y, lat, g);
      const s = newStrand("micro", g, a.x, a.y);
      s.lat = lat;
      s.probe = { len: rand(0.5, 1.2), z: rand(1, 5), ph: rand(0, 6.28) };
      s.ttl = rand(0.7, 1.9);
      s.vol = Math.PI * 0.55 * 0.55 * 40;
      strands.push(s);
    }

    // idle life: every couple of seconds a small burst of 2–3 thin strands curls out of a random spot on the
    // edge, glides along the contour in one direction, and sinks back in like a passing wave
    // a point on the pill outline at fraction t (0..1) of its perimeter, so every part of the edge is equally likely
    function outlineAt(t, g) {
      const a = g.hw - g.hh,
        straight = 2 * a,
        cap = Math.PI * g.hh,
        per = 2 * straight + 2 * cap;
      let s = (((t % 1) + 1) % 1) * per;
      if (s < straight) return pillEdge(g.cx - a + s, g.cy - g.hh - 1, g); // top
      s -= straight;
      if (s < cap) {
        const th = -Math.PI / 2 + s / g.hh;
        return pillEdge(
          g.cx + a + Math.cos(th) * g.hh * 2,
          g.cy + Math.sin(th) * g.hh * 2,
          g,
        );
      } // right end
      s -= cap;
      if (s < straight) return pillEdge(g.cx + a - s, g.cy + g.hh + 1, g); // bottom
      s -= straight;
      const th = Math.PI / 2 + s / g.hh;
      return pillEdge(
        g.cx - a + Math.cos(th) * g.hh * 2,
        g.cy + Math.sin(th) * g.hh * 2,
        g,
      ); // left end
    }
    let lastProbeT = Math.random();
    function spawnProbe(g) {
      const dir = Math.random() < 0.5 ? -1 : 1,
        n = Math.random() < 0.5 ? 1 : 2;
      // somewhere new each time: at least a quarter of the way round from the previous burst
      const t = lastProbeT + rand(0.25, 0.75);
      lastProbeT = t;
      const base = outlineAt(t, g);
      for (let i = 0; i < n && strands.length < MAXS - 2; i++) {
        const lat = (i - (n - 1) / 2) * 13 + rand(-3, 3);
        const a = pillEdge(
          base.x - base.ny * lat,
          base.y + base.nx * lat,
          g,
          8,
        );
        const s = newStrand("probe", g, a.x, a.y);
        s.probe = {
          nx: a.nx,
          ny: a.ny,
          dist: rand(7, 13),
          z: rand(2, 6),
          dir,
          delay: i * 0.07,
        };
        s.ttl = rand(0.8, 1.0);
        s.vol = Math.PI * 0.8 * 0.8 * 40;
        strands.push(s);
      }
    }

    const cum = new Float32Array(NP),
      tmpP = new Float32Array(NP * 3),
      tmpV = new Float32Array(NP * 3);
    // keep the first Lnew pixels of the polyline, redistributed over all points
    function truncate(s, Lnew) {
      const pos = s.pos,
        prev = s.prev;
      cum[0] = 0;
      for (let i = 1; i < NP; i++) {
        const a = (i - 1) * 3,
          b = i * 3;
        cum[i] =
          cum[i - 1] +
          Math.hypot(
            pos[b] - pos[a],
            pos[b + 1] - pos[a + 1],
            pos[b + 2] - pos[a + 2],
          );
      }
      if (cum[NP - 1] < 1e-3 || Lnew >= cum[NP - 1]) return;
      let k = 0;
      for (let j = 0; j < NP; j++) {
        const target = (Lnew * j) / (NP - 1);
        while (k < NP - 2 && cum[k + 1] < target) k++;
        const t = clamp(
          (target - cum[k]) / Math.max(cum[k + 1] - cum[k], 1e-6),
          0,
          1,
        );
        for (let c = 0; c < 3; c++) {
          tmpP[j * 3 + c] = pos[k * 3 + c] * (1 - t) + pos[(k + 1) * 3 + c] * t;
          tmpV[j * 3 + c] =
            prev[k * 3 + c] * (1 - t) + prev[(k + 1) * 3 + c] * t;
        }
      }
      pos.set(tmpP);
      prev.set(tmpV);
    }

    function resample(src, a, b) {
      const out = new Float32Array(NP * 3);
      for (let j = 0; j < NP; j++) {
        const f = a + ((b - a) * j) / (NP - 1);
        const i0 = clamp(Math.floor(f), 0, NP - 2),
          t = f - i0;
        for (let c = 0; c < 3; c++)
          out[j * 3 + c] =
            src[i0 * 3 + c] * (1 - t) + src[(i0 + 1) * 3 + c] * t;
      }
      return out;
    }

    // pinch-off at the neck: the base whips back into the surface, the tip half recoils into its wrap and unwinds
    function split(s, g) {
      const k = s.neckS * (NP - 1);
      const base = {
        ...s,
        kind: "piece",
        state: "recoil",
        pin: "anchor",
        pinch: 0,
        mound: s.mound,
        wrap: null,
        pos: resample(s.pos, 0, k),
        prev: resample(s.prev, 0, k),
        rad: new Float32Array(NP),
        vol: s.vol * s.neckS,
      };
      const tip = {
        ...s,
        kind: "piece",
        state: "recoil",
        pin: "cursor",
        pinch: 0,
        mound: 0,
        pos: resample(s.pos, NP - 1, k),
        prev: resample(s.prev, NP - 1, k),
        rad: new Float32Array(NP),
        vol: s.vol * (1 - s.neckS),
      };
      base.len = s.len * s.neckS;
      base.rest = base.len / (NP - 1);
      tip.len = s.len * (1 - s.neckS);
      tip.rest = tip.len / (NP - 1);
      base.retract = tip.retract = 0;
      const idx = strands.indexOf(s);
      strands[idx] = base;
      if (strands.length < MAXS) strands.push(tip);
      addRipple(g.cx + s.lx * g.hw, g.cy + s.ly * g.hh, 0.8);
      lastSnap = time;
    }

    function releaseAll(absorb) {
      for (const s of strands) {
        if (
          s.kind === "reach" &&
          (s.state === "grow" || s.state === "attached")
        ) {
          if (absorb || s.state === "grow") {
            s.state = "recoil";
            s.kind = "piece";
          } else if (!s.pinch) s.pinch = 1e-4;
        }
      }
    }

    function stepStrand(s, dt, g, present, inside) {
      s.life += dt;
      const w = s.wrap;
      if (w) {
        w.slide = 0.045 * Math.sin(time * 1.4 + w.ph); // coils creep along the finger, alive
        if (s.state === "attached")
          w.prog += (1 - w.prog) * (1 - Math.exp(-dt * 10)); // wind on, quickly
        else if (s.state === "recoil") {
          // unwind; the freed tip piece goes with it, nothing is left on the pointer
          w.prog -= dt * 5;
          if (w.prog <= 0) {
            s.wrap = null;
            if (s.pin === "cursor") s.dead = true;
          }
        }
      }
      const R =
        s.pin === "anchor"
          ? [
              g.cx + s.lx * g.hw,
              g.cy + s.ly * g.hh,
              Math.max(2, g.top - 4) + btn.lift * LIFT_H,
            ]
          : s.wrap
            ? coilStart(s)
            : [cur.x, cur.y, CURZ];

      // where the tip wants to be
      let T = null;
      if (
        s.kind === "reach" &&
        (s.state === "grow" || s.state === "attached")
      ) {
        T = coilStart(s);
        if (s.state === "attached") {
          // sticky feet: the anchor peels along the surface toward the cursor
          const an = anchorFor(cur.x, cur.y, s.lat, g),
            k = 1 - Math.exp(-dt * 1.4);
          s.lx += ((an.x - g.cx) / g.hw - s.lx) * k;
          s.ly += ((an.y - g.cy) / g.hh - s.ly) * k;
        }
      } else if (s.kind === "micro" && s.state !== "recoil") {
        const an = anchorFor(cur.x, cur.y, s.lat, g),
          k = 1 - Math.exp(-dt * 2);
        s.lx += ((an.x - g.cx) / g.hw - s.lx) * k;
        s.ly += ((an.y - g.cy) / g.hh - s.ly) * k;
        const e2 = pillEdge(R[0], R[1], g);
        let tx = cur.x - R[0],
          ty = cur.y - R[1];
        const tl = Math.hypot(tx, ty) || 1;
        let dx = e2.nx * 0.25 + (tx / tl) * 0.75,
          dy = e2.ny * 0.25 + (ty / tl) * 0.75;
        const dl = Math.hypot(dx, dy) || 1;
        dx /= dl;
        dy /= dl;
        const len = (10 + 38 * awareNow) * s.probe.len,
          sway = Math.sin(time * 3 + s.probe.ph) * 4;
        T = [
          R[0] + dx * len - dy * sway,
          R[1] + dy * len + dx * sway,
          R[2] + s.probe.z * awareNow,
        ];
        if (s.life > s.ttl || awareNow < 0.08) {
          s.state = "recoil";
          T = null;
        }
      } else if (s.kind === "probe" && s.state !== "recoil") {
        // out and back like a wave, gliding along the contour while it is out
        const pr = s.probe,
          f = clamp((s.life - pr.delay) / s.ttl, 0, 1),
          wave = Math.sin(Math.PI * f);
        const glide = pr.dir * (f - 0.3) * 24,
          out = 3 + pr.dist * wave;
        T = [
          R[0] + pr.nx * out - pr.ny * glide,
          R[1] + pr.ny * out + pr.nx * glide,
          R[2] + pr.z * wave,
        ];
        if (s.life > s.ttl + pr.delay) {
          s.state = "recoil";
          T = null;
        }
      }

      let tip = null;
      if (T) {
        const L0 = Math.hypot(T[0] - R[0], T[1] - R[1], T[2] - R[2]);
        if (s.state === "grow") {
          const f = 3.8 * P.whip * (0.75 + 0.25 * P.magnet),
            z = 0.5,
            r = -0.2;
          const k1 = z / (Math.PI * f),
            k2 = 1 / (2 * Math.PI * f) ** 2,
            k3 = (r * z) / (2 * Math.PI * f);
          const xd = s.uKick ? 1 / dt : 0;
          s.uKick = false;
          const k2s = Math.max(k2, (dt * dt) / 2 + (dt * k1) / 2, dt * k1);
          s.u += dt * s.ud;
          s.ud += (dt * (1 + k3 * xd - s.u - k1 * s.ud)) / k2s;
          const u = s.u,
            uc = clamp(u, 0, 1);
          const L2 = Math.hypot(T[0] - R[0], T[1] - R[1]) || 1;
          const nx = -(T[1] - R[1]) / L2,
            ny = (T[0] - R[0]) / L2;
          const lat =
            s.side * s.wig * Math.sin(Math.PI * uc) * Math.min(L2 * 0.3, 38);
          tip = [
            R[0] + (T[0] - R[0]) * u + nx * lat,
            R[1] + (T[1] - R[1]) * u + ny * lat,
            R[2] + (T[2] - R[2]) * uc + 22 * Math.sin(Math.PI * uc),
          ];
          s.rest = (Math.max(4, L0 * Math.max(u, 0.03)) * 1.05) / (NP - 1);
          if (u > 0.85 && Math.abs(s.ud) < 1.6) s.state = "attached";
        } else {
          tip = T;
          let Lr = s.rest * (NP - 1);
          if (L0 < Lr * 1.03)
            Lr += (L0 * 1.03 - Lr) * (1 - Math.exp(-dt * 3.5)); // reel in slack
          else Lr += (L0 - Lr) * (1 - Math.exp(-dt * P.creep)); // viscous flow feeds the strand
          s.rest = Lr / (NP - 1);
          s.stretch = L0 / Math.max(Lr, 1);
          if (
            s.kind === "reach" &&
            !s.pinch &&
            (s.stretch > P.snapStretch * s.snapMul || L0 > P.maxLen * s.lenMul)
          )
            s.pinch = 1e-4;
        }
      } else if (s.state === "recoil") {
        // free end retracts along its own path at roughly constant speed (Taylor–Culick);
        // volume piles into the end cap instead of the chain buckling
        s.retract += dt;
        // rubber band return: fast at first, easing into the body without overshoot
        const Ln = Math.max(
          0,
          s.len * Math.exp(-dt * 9) - (s.pin === "cursor" ? 160 : 110) * dt,
        );
        truncate(s, Ln);
        s.rest = Ln / (NP - 1);
      }

      if (s.pinch > 0) {
        s.pinch += dt / 0.1;
        if (s.pinch >= 1) {
          split(s, g);
          return;
        }
      }

      // ── verlet integration
      const pos = s.pos,
        prev = s.prev;
      const damp = s.state === "recoil" ? 0.94 : 0.975; // heavy, rubbery damping
      const lastO = (NP - 1) * 3;
      const ex = pos[lastO] - R[0],
        ey = pos[lastO + 1] - R[1],
        el = Math.hypot(ex, ey) || 1;
      const px = -ey / el,
        py = ex / el;
      const slack = clamp(1.35 - s.stretch, 0.15, 1);
      const amp =
        (reduced || s.state === "recoil" ? 0 : 700) *
        P.slither *
        slack *
        (s.state === "grow" ? 0.4 : 1);
      const gdt = P.gravity * dt * dt;
      // magnetism: the body of a live strand bows toward the cursor, not just its tip
      const mag =
        (s.kind === "reach" || s.kind === "micro") &&
        s.state !== "recoil" &&
        cur.present
          ? P.magnet * 900 * dt * dt
          : 0;
      for (let i = 1; i < NP; i++) {
        const o = i * 3,
          sp = i / (NP - 1);
        const vx = (pos[o] - prev[o]) * damp,
          vy = (pos[o + 1] - prev[o + 1]) * damp,
          vz = (pos[o + 2] - prev[o + 2]) * damp;
        prev[o] = pos[o];
        prev[o + 1] = pos[o + 1];
        prev[o + 2] = pos[o + 2];
        const env = Math.sin(Math.PI * sp);
        const wave =
          Math.sin(sp * 8.5 - time * 7.5 + s.phase) * env * amp * dt * dt;
        pos[o] += vx + px * wave;
        pos[o + 1] += vy + py * wave;
        pos[o + 2] +=
          vz -
          gdt +
          Math.cos(sp * 6 - time * 5 + s.phase) * env * amp * 0.25 * dt * dt;
        if (mag) {
          const mx = cur.x - pos[o],
            my = cur.y - pos[o + 1],
            ml = Math.hypot(mx, my) || 1;
          pos[o] += (mx / ml) * mag * env;
          pos[o + 1] += (my / ml) * mag * env;
        }
      }

      // ── constraints (pins, length, bend limit)
      const rest = Math.max(s.rest, 0.05);
      for (let it = 0; it < ITER; it++) {
        pos[0] = R[0];
        pos[1] = R[1];
        pos[2] = R[2];
        if (tip) {
          pos[lastO] = tip[0];
          pos[lastO + 1] = tip[1];
          pos[lastO + 2] = tip[2];
        }
        for (let i = 0; i < NP - 1; i++) {
          const a = i * 3,
            b = a + 3;
          let dx = pos[b] - pos[a],
            dy = pos[b + 1] - pos[a + 1],
            dz = pos[b + 2] - pos[a + 2];
          const d = Math.hypot(dx, dy, dz) || 1e-6;
          const wa = i === 0 ? 0 : 1,
            wb = i + 1 === NP - 1 && tip ? 0 : 1,
            ws = wa + wb;
          if (!ws) continue;
          const diff = ((d - rest) / d) * 0.95;
          dx *= diff;
          dy *= diff;
          dz *= diff;
          if (wa) {
            const f = wa / ws;
            pos[a] += dx * f;
            pos[a + 1] += dy * f;
            pos[a + 2] += dz * f;
          }
          if (wb) {
            const f = wb / ws;
            pos[b] -= dx * f;
            pos[b + 1] -= dy * f;
            pos[b + 2] -= dz * f;
          }
        }
        for (let i = 0; i < NP - 2; i++) {
          // muscular: resist kinking
          const a = i * 3,
            b = a + 6;
          let dx = pos[b] - pos[a],
            dy = pos[b + 1] - pos[a + 1],
            dz = pos[b + 2] - pos[a + 2];
          const d = Math.hypot(dx, dy, dz) || 1e-6,
            min = rest * 1.55;
          if (d >= min) continue;
          const wa = i === 0 ? 0 : 1,
            wb = i + 2 === NP - 1 && tip ? 0 : 1,
            ws = wa + wb;
          if (!ws) continue;
          const diff = ((d - min) / d) * 0.25;
          dx *= diff;
          dy *= diff;
          dz *= diff;
          if (wa) {
            const f = wa / ws;
            pos[a] += dx * f;
            pos[a + 1] += dy * f;
            pos[a + 2] += dz * f;
          }
          if (wb) {
            const f = wb / ws;
            pos[b] -= dx * f;
            pos[b + 1] -= dy * f;
            pos[b + 2] -= dz * f;
          }
        }
      }
      for (let i = 1; i < NP; i++) {
        // floor contact is sticky
        const o = i * 3,
          rmin = s.rad[i] * 0.7;
        if (pos[o + 2] < rmin) {
          pos[o + 2] = rmin;
          prev[o] += (pos[o] - prev[o]) * 0.3;
          prev[o + 1] += (pos[o + 1] - prev[o + 1]) * 0.3;
        }
      }

      // ── thickness: volume conservation, necking, Rayleigh–Plateau beads (~9 radii apart)
      let L = 0;
      for (let i = 0; i < NP - 1; i++) {
        const a = i * 3,
          b = a + 3;
        L += Math.hypot(
          pos[b] - pos[a],
          pos[b + 1] - pos[a + 1],
          pos[b + 2] - pos[a + 2],
        );
      }
      s.len = L;
      const rMean =
        clamp(
          Math.sqrt(s.vol / (Math.PI * Math.max(L, 2))),
          0.55,
          s.state === "recoil" ? 5 : 7.5,
        ) * P.thickness;
      const held = s.state === "attached";
      const neck = held ? clamp((s.stretch - 1.15) / 1.2, 0, 0.7) : 0;
      const nk = neck * (1 - s.pinch) + s.pinch * 0.96;
      const bead = held ? clamp((s.stretch - 1.5) / 0.8, 0, 1) : 0;
      const beadFreq = L / (9 * Math.max(rMean, 0.6));
      const capGrow = s.state === "recoil" ? Math.min(0.8, s.retract * 3) : 0;
      for (let i = 0; i < NP; i++) {
        const sp = i / (NP - 1);
        // thick where it leaves the body; reaching tendrils thin out into the fine wrap filament
        let r =
          rMean * (s.pin === "cursor" ? 0.6 : 1 + 0.55 * Math.exp(-sp / 0.08));
        if (
          (s.wrap && s.kind === "reach") ||
          s.kind === "micro" ||
          s.kind === "probe"
        )
          r *= 1 - 0.62 * ease(0.5, 1, sp);
        else r *= 1 + (0.5 + capGrow) * Math.exp(-(1 - sp) / 0.07);
        r *= 1 - nk * Math.exp(-(((sp - s.neckS) / 0.16) ** 2));
        r *= 1 + bead * 0.3 * Math.sin(sp * Math.PI * 2 * beadFreq + s.phase);
        s.rad[i] = Math.max(r, 0.35);
      }

      // surface tent where the strand leaves the goo, stretched along the pull direction
      let moundT = 0,
        elongT = 0;
      if (s.pin === "anchor") {
        // the base is stretchy: the surface itself is drawn up into a long cone along the pull
        if (s.state === "grow") {
          moundT = 7;
          elongT = 0.9;
        } else if (s.state === "attached") {
          moundT = 6 + 6 * clamp(s.stretch - 1, 0, 1.4);
          elongT = 1.0 + 1.6 * clamp(s.stretch - 0.8, 0, 1.4);
        }
        if (s.kind === "micro") {
          moundT *= 0.35;
          elongT *= 0.6;
        }
        if (s.kind === "probe") {
          moundT *= 0.12;
          elongT *= 0.4;
        } // idle strands barely lift the surface
      }
      s.mound +=
        (moundT * 0.55 * P.pull - s.mound) *
        (1 - Math.exp(-dt * (moundT > s.mound ? 10 : 5)));
      s.elong =
        (s.elong || 0) + (elongT - (s.elong || 0)) * (1 - Math.exp(-dt * 8));
      const dxm = pos[9] - pos[0],
        dym = pos[10] - pos[1],
        dm = Math.hypot(dxm, dym);
      if (dm > 1) {
        s.dirX = dxm / dm;
        s.dirY = dym / dm;
      } else if (s.dirX === undefined) {
        s.dirX = 0;
        s.dirY = -1;
      }

      if (s.state === "recoil" && (s.rest * (NP - 1) < 12 || L < 5)) {
        s.dead = true;
        if (s.pin === "anchor" && s.kind !== "micro")
          addRipple(R[0], R[1], 0.5);
      }
    }

    // ───────────────────────────── crawling droplets ─────────────────────────────
    function stepCrawler(c, dt, g) {
      c.t += dt;
      if (c.state === "fall") {
        c.vz -= P.gravity * 1.6 * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.z += c.vz * dt;
        c.vx *= 0.985;
        c.vy *= 0.985;
        if (c.z <= c.r * 0.55) {
          c.z = c.r * 0.55;
          c.state = "crawl";
          c.sqV = -5;
          c.sq = 0.55;
        }
        return;
      }
      const e = pillEdge(c.x, c.y, g);
      const pulse = Math.sin(c.t * 9) ** 2;
      const speed = 110 + 230 * pulse;
      const wob = Math.sin(c.t * 11 + c.phase) * 40;
      c.x += (-e.nx * speed - e.ny * wob) * dt;
      c.y += (-e.ny * speed + e.nx * wob) * dt;
      spring(c, "sq", "sqV", 0.5 + 0.16 * pulse, 30, 0.5, dt);
      c.z = c.r * c.sq * 0.9;
      if (e.d < -c.r) {
        c.dead = true;
        addRipple(e.x + e.nx * c.r, e.y + e.ny * c.r, 1.0);
      }
    }

    // ───────────────────────────── simulation step ─────────────────────────────
    function step(dt) {
      if (!reduced) time += dt;
      spring(btn, "intro", "introV", 1, 9, 0.85, dt);
      spring(btn, "press", "pressV", btn.pressTarget, 30, 0.75, dt);
      labelAmt +=
        (labelTarget - labelAmt) * (1 - Math.exp(-dt * (time > 0.6 ? 4 : 0)));
      const g = geo();

      const present = cur.present && btn.intro > 0.6;
      const e = pillEdge(cur.x, cur.y, g);
      const inside = present && e.d < -4;
      const aware = present && !inside ? ease(P.awareness, 18, e.d) : 0;
      awareNow = aware;

      // anticipation: the surface leans and trembles toward the cursor
      const tremble = reduced ? 0 : 1 + 0.03 * Math.sin(time * 19) * aware;
      spring(pull, "amt", "v", 0, 14, 1.0, dt); // the face stays flat: only the strands reach
      const pk = 1 - Math.exp(-dt * 10);
      pull.x += (e.x - e.nx * 6 - pull.x) * pk;
      pull.y += (e.y - e.ny * 6 - pull.y) * pk;
      // magnetic peak under the cursor when hovering on the goo
      // hovering on the button lifts the whole slab evenly instead of raising a bump under the cursor
      spring(peak, "amt", "v", 0, 12, 1.0, dt);
      spring(btn, "lift", "liftV", inside ? 1 : 0, 11, 0.95, dt);
      CURZ = g.top + btn.lift * LIFT_H + 11; // hover a little above the button, never far above it
      const fk = 1 - Math.exp(-dt * 14);
      peak.x += (cur.x - peak.x) * (peak.amt < 0.02 ? 1 : fk);
      peak.y += (cur.y - peak.y) * (peak.amt < 0.02 ? 1 : fk);

      if (!reduced) {
        const active = strands.filter(
          (s) =>
            s.kind === "reach" &&
            (s.state === "grow" || s.state === "attached"),
        ).length;
        if (!present) releaseAll(false);
        else if (inside) releaseAll(true);
        else {
          const want =
            e.d < P.reach
              ? Math.min(
                  P.maxStrands,
                  Math.round(
                    Math.min(2, P.maxStrands) +
                      Math.max(0, P.maxStrands - 2) *
                        ease(P.reach, P.reach * 0.4, e.d),
                  ),
                )
              : 0;
          if (
            active < want &&
            time - lastSpawn > rand(0.03, 0.06) &&
            time - lastSnap > 0.15
          ) {
            spawnReach(g);
            lastSpawn = time;
          }
          const micro = strands.filter(
            (s) => s.kind === "micro" && s.state !== "recoil",
          ).length;
          if (
            micro < Math.round(9 * ease(0.1, 0.8, aware)) &&
            time - lastMicro > rand(0.03, 0.07)
          ) {
            spawnMicro(g);
            lastMicro = time;
          }
        }
        if (!inside && aware < 0.02 && time > nextProbe && btn.intro > 0.95) {
          if (strands.every((s) => s.kind === "probe" || s.state === "recoil"))
            spawnProbe(g);
          nextProbe = time + rand(4, 6);
        }
      }

      for (let i = 0; i < strands.length; i++)
        stepStrand(strands[i], dt, g, present, inside);
      for (let i = strands.length - 1; i >= 0; i--)
        if (strands[i].dead) strands.splice(i, 1);

      // the cursor is always the big 3D icon while a mouse is over the page; it never falls back to the OS cursor
      const wrapped = strands.some((s) => s.wrap);
      const engage =
        !reduced &&
        hand.ready &&
        present &&
        (e.d < P.reach + 40 || inside || wrapped);
      spring(hand, "s", "v", HAND_BIG, 16, 0.9, dt);
      // engulf front: hand parts within this many px of the button get coated; over the button it seals completely
      spring(
        hand,
        "coat",
        "coatV",
        inside ? 160 : present ? clamp(45 - e.d, -60, 160) : -60,
        9,
        0.9,
        dt,
      );
      const thrT = inside ? 0.57 : 0.8 - 0.2 * clamp(1 - e.d / 60, 0, 1); // ~35% coverage at most
      hand.thr += (thrT - hand.thr) * (1 - Math.exp(-dt * 4));
      hand.on = hand.ready && cur.present && cur.mouse;
      // arrow → hand the instant the goo is about to touch: a lunging tendril past halfway, a latch, or the body
      const touching =
        inside ||
        strands.some(
          (s) =>
            s.kind === "reach" &&
            (s.state === "attached" || (s.state === "grow" && s.u > 0.5)),
        );
      spring(
        hand,
        "m",
        "mV",
        (engage && touching) || (hand.on && inside) ? 1 : 0,
        32,
        1.0,
        dt,
      );
      hand.m = clamp(hand.m, 0, 1);
      // caught in the web: the wrapped strands' tension tugs the drawn hand back along them and turns it so
      // the wrist swings toward the pull (the fingertip is held by the real pointer). Pulling away meets a
      // little friction; when the strands snap, the springs let it pop back onto the pointer
      let tx = 0,
        ty = 0;
      for (const s of strands) {
        if (s.kind !== "reach" || s.state !== "attached" || !s.wrap) continue;
        const a = (NP - 1) * 3,
          b = (NP - 4) * 3;
        const dx = s.pos[b] - s.pos[a],
          dy = s.pos[b + 1] - s.pos[a + 1],
          dl = Math.hypot(dx, dy) || 1;
        const tension = clamp(s.stretch - 0.7, 0, 1.2) * s.wrap.prog;
        tx += (dx / dl) * tension;
        ty += (dy / dl) * tension;
      }
      const tm = Math.hypot(tx, ty),
        grip = hand.on ? Math.min(1, tm / 1.5) * P.grip : 0;
      const ux = tm > 1e-4 ? tx / tm : 0,
        uy = tm > 1e-4 ? ty / tm : 0;
      spring(hand, "ox", "oxV", ux * PULL_MAX * grip, 16, 0.62, dt);
      spring(hand, "oy", "oyV", uy * PULL_MAX * grip, 16, 0.62, dt);
      let dA = Math.atan2(uy, ux) - WRIST_ANG;
      dA = Math.atan2(Math.sin(dA), Math.cos(dA));
      const pullTilt =
        tm > 1e-4 ? clamp(dA * 0.35, -TILT_MAX, TILT_MAX) * grip : 0;
      spring(
        hand,
        "ang",
        "angV",
        clamp(cur.vx * 0.00022, -0.32, 0.32) + pullTilt,
        12,
        0.85,
        dt,
      );

      for (const c of crawlers) stepCrawler(c, dt, g);
      for (let i = crawlers.length - 1; i >= 0; i--)
        if (crawlers[i].dead) crawlers.splice(i, 1);
      for (const r of ripples) r.age += dt;
      while (ripples.length && ripples[0].age > 1.6) ripples.shift();

      cur.vx *= Math.exp(-dt * 8);
      cur.vy *= Math.exp(-dt * 8);
    }

    // ───────────────────────────── render ─────────────────────────────
    const ptsBuf = new Float32Array(MAXS * NP * 4),
      boxBuf = new Float32Array(MAXS * 4),
      ancBuf = new Float32Array(MAXS * 4);
    const ancDBuf = new Float32Array(MAXS * 4),
      brBuf = new Float32Array(MAXBR * 12);
    const coilBuf = new Float32Array(MAXC * WP * 4),
      cboxBuf = new Float32Array(MAXC * 4);
    const blobBuf = new Float32Array(MAXB * 4),
      blobZBuf = new Float32Array(MAXB),
      ripBuf = new Float32Array(MAXR * 4);
    const K = [2.5, 6, 5]; // tight joins: stringy and elastic, not a fluid that pools

    function render() {
      const g = geo();
      let zTop =
        g.top +
        btn.dome +
        pull.amt +
        peak.amt * PEAK_H * P.pull +
        btn.lift * LIFT_H +
        4;
      let maxMound = 0;

      const ns = Math.min(strands.length, MAXS);
      for (let i = 0; i < ns; i++) {
        const s = strands[i];
        let x0 = 1e9,
          y0 = 1e9,
          x1 = -1e9,
          y1 = -1e9,
          rMax = 0;
        for (let j = 0; j < NP; j++) {
          const o = (i * NP + j) * 4,
            x = s.pos[j * 3],
            y = s.pos[j * 3 + 1],
            z = s.pos[j * 3 + 2],
            r = s.rad[j];
          ptsBuf[o] = x;
          ptsBuf[o + 1] = y;
          ptsBuf[o + 2] = z;
          ptsBuf[o + 3] = r;
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
          rMax = Math.max(rMax, r);
          zTop = Math.max(zTop, z + r + K[1] * 0.3);
        }
        const pad = rMax + K[1] + 3;
        boxBuf.set([x0 - pad, y0 - pad, x1 + pad, y1 + pad], i * 4);
        const ax = s.pin === "anchor" ? g.cx + s.lx * g.hw : 0,
          ay = s.pin === "anchor" ? g.cy + s.ly * g.hh : 0;
        const m = s.pin === "anchor" ? s.mound : 0;
        maxMound = Math.max(maxMound, m);
        ancBuf.set([ax, ay, m, 17], i * 4);
        ancDBuf.set([s.dirX ?? 0, s.dirY ?? -1, s.elong || 0, 0], i * 4);
      }
      zTop += maxMound;

      // silk bridges between neighbouring held tendrils, bowed back toward the body like webbing
      const held = strands
        .filter((s) => s.kind === "reach" && s.state === "attached")
        .sort((a, b) => a.lat - b.lat);
      let nbr = 0;
      for (let i = 0; i + 1 < held.length && nbr < MAXBR; i++) {
        const A = held[i],
          B = held[i + 1];
        const grow = clamp((Math.min(A.life, B.life) - 0.3) * 4, 0, 1);
        const taut = clamp(2.3 - Math.max(A.stretch, B.stretch), 0.25, 1);
        for (const sp of [0.22, 0.42, 0.62]) {
          if (nbr >= MAXBR) break;
          const j = Math.round(sp * (NP - 1)) * 3;
          const ax = A.pos[j],
            ay = A.pos[j + 1],
            az = A.pos[j + 2],
            bx = B.pos[j],
            by = B.pos[j + 1],
            bz = B.pos[j + 2];
          const dist = Math.hypot(bx - ax, by - ay);
          const r =
            0.22 * P.thickness * clamp(1.6 - dist / 70, 0, 1) * grow * taut;
          if (r < 0.2) continue;
          const rx = (A.pos[0] + B.pos[0]) / 2,
            ry = (A.pos[1] + B.pos[1]) / 2;
          let mx = (ax + bx) / 2,
            my = (ay + by) / 2;
          const dl = Math.hypot(rx - mx, ry - my) || 1,
            sag = dist * 0.22;
          mx += ((rx - mx) / dl) * sag;
          my += ((ry - my) / dl) * sag;
          brBuf.set(
            [
              ax,
              ay,
              az,
              r,
              mx,
              my,
              (az + bz) / 2 - dist * 0.05,
              r * 0.75,
              bx,
              by,
              bz,
              r,
            ],
            nbr * 12,
          );
          nbr++;
        }
      }

      // wrap coils: main filaments first, then the hair-thin companions if there is room
      let nc = 0;
      if (hand.on && hand.m > 0.6) {
        // wraps only once the icon has become the hand
        for (const hair of [false, true]) {
          for (const s of strands) {
            if (nc >= MAXC) break;
            if (!s.wrap || s.wrap.prog < 0.02) continue;
            let x0 = 1e9,
              y0 = 1e9,
              x1 = -1e9,
              y1 = -1e9;
            for (let j = 0; j < WP; j++) {
              const q = coilPoint(s, j / (WP - 1), hair);
              coilBuf.set(q, (nc * WP + j) * 4);
              x0 = Math.min(x0, q[0]);
              y0 = Math.min(y0, q[1]);
              x1 = Math.max(x1, q[0]);
              y1 = Math.max(y1, q[1]);
            }
            const pad = 4 + K[1];
            cboxBuf.set([x0 - pad, y0 - pad, x1 + pad, y1 + pad], nc * 4);
            nc++;
          }
        }
      }
      // the floating icon must sit under the ray start wherever it is, not only near the goo
      if (hand.on) zTop = Math.max(zTop, CURZ + handTh() + 6);
      // mozzarella: hair-thin fibres peel away from a stretched tendril and rejoin it at both ends
      for (const s of strands) {
        if (s.kind !== "reach" || s.state !== "attached") continue;
        const spread =
          clamp((s.stretch - 0.8) * 18, 0, 9) * clamp((s.life - 0.4) * 3, 0, 1);
        if (spread < 0.5) continue;
        for (const side of [-1, 1, 0.4]) {
          if (nc >= MAXC) break;
          let x0 = 1e9,
            y0 = 1e9,
            x1 = -1e9,
            y1 = -1e9;
          for (let j = 0; j < WP; j++) {
            const f = j / (WP - 1),
              fi = f * (NP - 1),
              i0 = Math.min(NP - 2, Math.floor(fi)),
              t = fi - i0;
            const a = i0 * 3,
              b = a + 3,
              P0 = s.pos;
            const tx = P0[b] - P0[a],
              ty = P0[b + 1] - P0[a + 1],
              tl = Math.hypot(tx, ty) || 1;
            const env = Math.sin(Math.PI * f) ** 1.4;
            const wob =
              0.75 + 0.25 * Math.sin(time * 3.1 + f * 7 + s.phase + side);
            const off = side * spread * env * wob * (side > 0 ? 1 : 0.7);
            const q = [
              P0[a] + (P0[b] - P0[a]) * t - (ty / tl) * off,
              P0[a + 1] + (P0[b + 1] - P0[a + 1]) * t + (tx / tl) * off,
              P0[a + 2] +
                (P0[b + 2] - P0[a + 2]) * t -
                spread * (side === 0.4 ? -0.25 : 0.35) * env,
              (0.24 + 0.1 * (1 - env)) * P.thickness,
            ];
            coilBuf.set(q, (nc * WP + j) * 4);
            x0 = Math.min(x0, q[0]);
            y0 = Math.min(y0, q[1]);
            x1 = Math.max(x1, q[0]);
            y1 = Math.max(y1, q[1]);
          }
          const pad = 4 + K[1];
          cboxBuf.set([x0 - pad, y0 - pad, x1 + pad, y1 + pad], nc * 4);
          nc++;
        }
      }
      const handOn = hand.on && hand.ready ? 1 : 0;

      let nb = 0;
      for (const c of crawlers) {
        if (nb >= MAXB) break;
        blobBuf.set([c.x, c.y, c.z, c.r], nb * 4);
        blobZBuf[nb] = c.state === "fall" ? 1 : c.sq;
        zTop = Math.max(zTop, c.z + c.r + 2);
        nb++;
      }
      ripBuf.fill(0);
      ripples.forEach((r, i) => ripBuf.set([r.x, r.y, r.age, r.amp], i * 4));

      const lb = [g.cx, g.cy + LABEL_NUDGE, btn.lbw, btn.lbh];
      const time2 = reduced ? 3 : time;

      // pass 1
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, W, H);
      gl.useProgram(p1.prog);
      gl.bindVertexArray(vao);
      const u1 = p1.u;
      gl.uniform2f(u1.uRes, W, H);
      gl.uniform1f(u1.uDpr, DPR);
      gl.uniform1f(u1.uTime, time2);
      gl.uniform4f(u1.uBtn, g.cx, g.cy, g.hw, g.hh);
      gl.uniform4f(u1.uBtnZ2, btn.lift * LIFT_H, BEVEL, 0, 0);
      gl.uniform4f(
        u1.uBtnZ,
        g.top,
        btn.sink * Math.min(1, btn.intro),
        btn.dome * Math.min(1, btn.intro),
        0,
      );
      gl.uniform4f(u1.uPull, pull.x, pull.y, pull.amt, 34);
      gl.uniform4f(u1.uPeak, peak.x, peak.y, peak.amt * PEAK_H * P.pull, 24);
      gl.uniform1i(u1.uNS, ns);
      gl.uniform4fv(u1.uPts, ptsBuf);
      gl.uniform4fv(u1.uBox, boxBuf);
      gl.uniform4fv(u1.uAnc, ancBuf);
      gl.uniform4fv(u1.uAncD, ancDBuf);
      gl.uniform1i(u1.uNBr, nbr);
      gl.uniform4fv(u1.uBr, brBuf);
      gl.uniform1i(u1.uNB, nb);
      gl.uniform4fv(u1.uBlob, blobBuf);
      gl.uniform1fv(u1.uBlobZ, blobZBuf);
      gl.uniform4fv(u1.uRip, ripBuf);
      gl.uniform4f(u1.uLabelBox, lb[0], lb[1], lb[2], lb[3]);
      gl.uniform1f(u1.uEmboss, 0.0);
      gl.uniform1f(u1.uZTop, zTop);
      gl.uniform3f(u1.uK, K[0], K[1], K[2]);
      gl.uniform1i(u1.uLabel, 1);
      gl.uniform1i(u1.uNC, nc);
      gl.uniform4fv(u1.uCoil, coilBuf);
      gl.uniform4fv(u1.uCBox, cboxBuf);
      gl.uniform4f(u1.uHand, cur.x + hand.ox, cur.y + hand.oy, hand.s, handOn);
      gl.uniform4f(
        u1.uHand2,
        Math.cos(hand.ang),
        Math.sin(hand.ang),
        CURZ,
        handTh(),
      );
      gl.uniform3f(u1.uCoat, hand.coat, 22, hand.thr);
      gl.uniform1i(u1.uHandSDF, 2);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, handSdfTex);
      gl.uniform1i(u1.uArrowSDF, 5);
      gl.activeTexture(gl.TEXTURE5);
      gl.bindTexture(gl.TEXTURE_2D, arrowSdfTex);
      gl.uniform1f(u1.uMorph, hand.m);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, labelTex);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, gTex);
      gl.generateMipmap(gl.TEXTURE_2D);

      // pass 2
      gl.bindFramebuffer(gl.FRAMEBUFFER, cFbo);
      gl.viewport(0, 0, W, H);
      gl.useProgram(p2.prog);
      const u2 = p2.u;
      gl.uniform1i(u2.uG, 0);
      gl.uniform1i(u2.uLabel, 1);
      gl.uniform2f(u2.uRes, W, H);
      gl.uniform1f(u2.uDpr, DPR);
      gl.uniform1f(u2.uTime, time2);
      gl.uniform4f(u2.uLabelBox, lb[0], lb[1], lb[2], lb[3]);
      gl.uniform1f(u2.uLabelAmt, labelAmt);
      gl.uniform1f(
        u2.uLabelLod,
        Math.max(0, Math.log2(LABEL_W / (2 * lb[2] * DPR)) - 0.6),
      ); // crisp letters
      gl.uniform1f(u2.uIri, P.sheen);
      gl.uniform1f(u2.uZMax, zTop);
      gl.uniform1f(u2.uLift, btn.lift);
      gl.uniform4f(u2.uBtnP, g.cx, g.cy, g.hw, g.hh);
      const inkHalf = (labelInkW * LABEL_CSS) / LABEL_PX / 2;
      gl.uniform2f(u2.uWin, -(inkHalf + 7) / g.hw, 7 / g.hw); // soft ~30px reflection in the left padding
      gl.uniform2f(u2.uBtnH, g.top, btn.lift * LIFT_H);
      gl.uniform4f(u2.uHand, cur.x + hand.ox, cur.y + hand.oy, hand.s, handOn);
      gl.uniform4f(
        u2.uHand2,
        Math.cos(hand.ang),
        Math.sin(hand.ang),
        CURZ,
        handTh(),
      );
      gl.uniform1i(u2.uHandCol, 3);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, handColTex);
      gl.uniform1i(u2.uArrowCol, 6);
      gl.activeTexture(gl.TEXTURE6);
      gl.bindTexture(gl.TEXTURE_2D, arrowColTex);
      gl.uniform1f(u2.uMorph, hand.m);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // pass 3: FXAA to the screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(p3.prog);
      gl.uniform1i(p3.u.uC, 4);
      gl.uniform2f(p3.u.uRes, W, H);
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, cTex);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function layoutButton() {
      const r = hitEl.getBoundingClientRect();
      btn.cx = r.left - area.left + r.width / 2;
      btn.cy = r.top - area.top + r.height / 2;
      btn.hh = r.height / 2;
      btn.hw = r.width / 2;
      const sc = LABEL_CSS / LABEL_PX;
      btn.lbw = (LABEL_W * sc) / 2;
      btn.lbh = (LABEL_H * sc) / 2;
    }
    function resize() {
      if (disposed || paused) return;
      const r = hitEl.getBoundingClientRect();
      area.left = Math.max(0, r.left - 260);
      area.top = Math.max(0, r.top - 260);
      area.width = Math.max(1, Math.min(innerWidth, r.right + 260) - area.left);
      area.height = Math.max(
        1,
        Math.min(innerHeight, r.bottom + 260) - area.top,
      );
      Object.assign(canvas.style, {
        left: area.left + "px",
        top: area.top + "px",
        width: area.width + "px",
        height: area.height + "px",
      });
      layoutButton();
      const dpr = Math.min(devicePixelRatio || 1, 2) * quality;
      const w = Math.max(1, Math.round(area.width * dpr)),
        h = Math.max(1, Math.round(area.height * dpr));
      if (W === w && H === h && gTex) return;
      W = w;
      H = h;
      canvas.width = W;
      canvas.height = H;
      DPR = W / viewW();
      makeGBuffer();
    }
    resize();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(hitEl);
    listen(window, "resize", resize, { passive: true });
    listen(
      window,
      "scroll",
      () => {
        cur.present = false;
        hand.on = false;
        cursor(false);
        resize();
      },
      { capture: true, passive: true },
    );
    listen(canvas, "webglcontextlost", (event) => {
      event.preventDefault();
      dispose();
    });

    let last = performance.now(),
      acc = 0,
      frameEma = 1 / 60,
      slowFor = 0;
    function frame(now) {
      if (disposed || paused) return;
      try {
        if (!programsReady) {
          programsReady = finishPrograms();
          last = now;
          if (!programsReady) {
            raf = requestAnimationFrame(frame);
            return;
          }
        }
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        frameEma += (dt - frameEma) * 0.05;
        acc += dt;
        let n = 0;
        while (acc >= SUB && n < 40) {
          step(SUB);
          acc -= SUB;
          n++;
        }
        if (n === 40) acc = 0;
        render();
        if (hand.ready && labelTarget === 1) {
          hitEl.dataset.venomReady = "true";
          canvas.style.opacity = "1";
          stillCanvas?.remove();
          stillCanvas = null;
          cursor(hand.on && cur.present);
          if (canvas.dataset.venomState !== "running")
            canvas.dataset.venomState = "running";
        }
        if (frameEma > 1 / 40 && dt < 0.09) slowFor += dt;
        else slowFor = 0;
        if (slowFor > 2 && quality > 0.8) {
          quality -= 0.1;
          slowFor = 0;
          resize();
        }
        raf = requestAnimationFrame(frame);
      } catch {
        dispose();
      }
    }
    raf = requestAnimationFrame(frame);
    const pointer = (e) => ({
      x: e.clientX - area.left,
      y: e.clientY - area.top,
    });
    const resetPointer = () => {
      cur.present = false;
      cur.mouse = false;
      cur.down = false;
      cur.vx = cur.vy = 0;
      hand.on = false;
      btn.pressTarget = 0;
      cursor(false);
    };
    listen(
      window,
      "pointermove",
      (e) => {
        if (paused || disposed) return;
        const other =
          e.target instanceof Element
            ? e.target.closest('a,button,input,textarea,select,[role="dialog"]')
            : null;
        const p = pointer(e);
        if (
          e.pointerType !== "mouse" ||
          (other && other !== hitEl) ||
          p.x < 30 ||
          p.y < 30 ||
          p.x > area.width - 60 ||
          p.y > area.height - 60
        ) {
          resetPointer();
          return;
        }
        const now = performance.now(),
          dt = Math.max(1, now - cur.t) / 1000;
        if (cur.present) {
          cur.vx = (p.x - cur.lx) / dt;
          cur.vy = (p.y - cur.ly) / dt;
        }
        cur.x = cur.lx = p.x;
        cur.y = cur.ly = p.y;
        cur.t = now;
        cur.present = true;
        cur.mouse = true;
      },
      { passive: true },
    );
    listen(document.documentElement, "pointerleave", resetPointer);
    listen(window, "blur", resetPointer);
    listen(window, "pointercancel", resetPointer);
    listen(window, "keydown", resetPointer);
    listen(hitEl, "pointerdown", () => {
      btn.pressTarget = 1;
    });
    listen(window, "pointerup", () => {
      if (btn.pressTarget) {
        btn.pressTarget = 0;
        addRipple(btn.cx, btn.cy, 1.6);
      }
    });
    listen(hitEl, "click", resetPointer);
    const rest = () => {
      resetPointer();
      btn.intro = 1;
      btn.introV =
        btn.lift =
        btn.liftV =
        btn.press =
        btn.pressV =
        btn.pressTarget =
          0;
      pull.amt = pull.v = peak.amt = peak.v = 0;
      strands.length = crawlers.length = ripples.length = 0;
      hand.on = false;
      hand.coat = -60;
      hand.coatV = hand.ox = hand.oy = hand.oxV = hand.oyV = 0;
      hand.ang = hand.angV = hand.m = hand.mV = 0;
      labelAmt = labelTarget;
      time = Math.max(time, 3);
      nextProbe = time + rand(4, 6);
    };
    return {
      dispose,
      pause({ keepVisible = false } = {}) {
        if (disposed) return;
        const ready = programsReady && hand.ready && labelTarget === 1;
        if (!paused) {
          paused = true;
          cancelAnimationFrame(raf);
          rest();
        }
        const hold = keepVisible && ready;
        // Retained frames must swap atomically; only initial startup crossfades.
        if (hold) canvas.dataset.venomRetained = "true";
        if (hold && !stillCanvas) {
          try {
            render();
            stillCanvas = document.createElement("canvas");
            stillCanvas.width = canvas.width;
            stillCanvas.height = canvas.height;
            const context = stillCanvas.getContext("2d");
            if (!context) throw new Error("No still-frame canvas");
            context.drawImage(canvas, 0, 0);
            stillCanvas.className = canvas.className;
            stillCanvas.style.cssText = canvas.style.cssText;
            stillCanvas.style.opacity = "1";
            stillCanvas.dataset.venomStill = "true";
            stillCanvas.setAttribute("aria-hidden", "true");
            canvas.after(stillCanvas);
          } catch {
            dispose();
            return;
          }
        } else if (!hold) {
          stillCanvas?.remove();
          stillCanvas = null;
        }
        canvas.style.opacity = "0";
        canvas.dataset.venomState = hold ? "paused-visible" : "paused-hidden";
        if (hold) hitEl.dataset.venomReady = "true";
        else delete hitEl.dataset.venomReady;
      },
      resume() {
        if (disposed || !paused) return;
        paused = false;
        rest();
        last = performance.now();
        acc = 0;
        frameEma = 1 / 60;
        slowFor = 0;
        resize();
        raf = requestAnimationFrame(frame);
      },
    };
  } catch {
    dispose();
  }
  return null;
}
