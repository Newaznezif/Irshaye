/**
 * Derives web-ready logo assets from the supplied PNGs in `public/Irshayelogos`.
 *
 * The five source files are 2000x2000 RGB PNGs with no alpha channel, ~90% empty
 * canvas and an off-centre wordmark. They cannot be dropped into a responsive shell
 * as-is, so this produces trimmed, transparent renditions. Originals are only read.
 *
 * Background is decided by *connectivity to the image border*, not by colour alone:
 * `4.png` draws its leaf veins in the same black as its background, so a colour key
 * would punch holes in the artwork. Veins that the fill cannot reach from the edge are
 * kept; an enclosed region only becomes transparent when it is too thick to be a stroke.
 * See `backgroundMask` for how the closing band is separated from drawn detail.
 *
 * Edge pixels are un-blended rather than keyed: for a pixel observed as a mix of the
 * background and one palette ink, the ink and its coverage are solved and written as
 * (ink, alpha), so the result composites correctly on any surface instead of
 * carrying a halo of the old background colour.
 *
 * Uses node:fs and node:zlib only — no image library is added to the project.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const SRC_DIR = 'public/Irshayelogos';
const OUT_DIR = 'public/Irshayelogos/derived';

/** source -> derived name, per the approved placement plan. */
const PLAN = [
  ['1.png', 'wordmark-light.png'],
  ['2.png', 'wordmark-print.png'],
  ['3.png', 'wordmark-dark-teal.png'],
  ['4.png', 'wordmark-dark.png'],
  ['5.png', 'wordmark-on-brand.png'],
];

/** Per-channel distance under which a pixel counts as background for the flood fill. */
const BG_TOLERANCE = 96;
/** Fit error under which a palette ink is accepted for a pixel. */
const FIT_TOLERANCE = 14;
/** Coverage below which an un-blended pixel counts as canvas rather than as a tapered edge. */
const MIN_COVERAGE = 0.02;
const PAD = 2;
/**
 * An enclosed background-coloured region is line detail (the leaf veins) rather than a
 * hole in a letterform when it is thinner than this many source pixels. Measured on the
 * supplied art: vein strokes are 0.8-1.3 px thick, the counters of "a" and "e" 16.0-16.5.
 */
const LINE_MAX_THICKNESS = 8;
/** Radius used to close the small gaps where a vein stroke meets a leaf edge. */
const CLOSE_RADIUS = 3;
/**
 * How far inside the artwork the un-blending pass reaches. Anti-aliasing in these files
 * is 1-3 source pixels wide; beyond that a pixel is interior detail and must stay solid.
 */
const BAND = 4;

function decodePng(file) {
  const buf = fs.readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file}: not a PNG`);
  let off = 8;
  let width = 0, height = 0, depth = 0, colorType = 0, interlace = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') idat.push(Buffer.from(data));
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (depth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`${file}: unsupported (depth=${depth} colorType=${colorType} interlace=${interlace})`);
  }
  const channels = colorType === 2 ? 3 : 4;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const rgb = Buffer.alloc(height * stride);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    const line = raw.subarray(p, p + stride);
    p += stride;
    const cur = rgb.subarray(y * stride, y * stride + stride);
    const prev = y > 0 ? rgb.subarray((y - 1) * stride, (y - 1) * stride + stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      const v = line[x];
      let out;
      if (filter === 0) out = v;
      else if (filter === 1) out = v + a;
      else if (filter === 2) out = v + b;
      else if (filter === 3) out = v + ((a + b) >> 1);
      else {
        const pp = a + b - c;
        const pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
        out = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      cur[x] = out & 255;
    }
  }
  return { width, height, channels, rgb };
}

/** The most common colour along the four edges — the canvas the artwork sits on. */
function edgeBackground({ width, height, channels, rgb }) {
  const counts = new Map();
  const bump = (i) => {
    const k = `${rgb[i]},${rgb[i + 1]},${rgb[i + 2]}`;
    counts.set(k, (counts.get(k) || 0) + 1);
  };
  for (let x = 0; x < width; x++) { bump(x * channels); bump((height - 1) * width * channels + x * channels); }
  for (let y = 0; y < height; y++) { bump(y * strideOf(width, channels)); bump(y * strideOf(width, channels) + (width - 1) * channels); }
  const [k] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return k.split(',').map(Number);
}
const strideOf = (width, channels) => width * channels;

/** Predicate: is this pixel close enough to the canvas colour to be ambiguous? */
function nearBackground({ channels, rgb }, bg) {
  return (idx) => {
    const i = idx * channels;
    return Math.abs(rgb[i] - bg[0]) <= BG_TOLERANCE &&
      Math.abs(rgb[i + 1] - bg[1]) <= BG_TOLERANCE &&
      Math.abs(rgb[i + 2] - bg[2]) <= BG_TOLERANCE;
  };
}

/**
 * Mark the pixels that are canvas.
 *
 * Reachability from the border is not enough on its own: the black leaf veins are drawn in
 * the same colour as the dark canvases, and they touch the canvas at a few points, so a
 * plain flood fill walks the whole vein network and deletes it. The fill therefore runs
 * over background-coloured pixels that are also at least CLOSE_RADIUS away from any ink,
 * which closes the 1-2 pixel necks where a vein meets a leaf edge.
 *
 * That closing leaves a band of canvas-coloured pixels hugging every silhouette, and the
 * band must not be mistaken for artwork: it is the anti-aliasing of an edge that has
 * already been removed. It is peeled back into the canvas here, growing inward from the
 * flooded canvas through canvas-coloured pixels, for at most CLOSE_RADIUS steps — far too
 * short to cross a leaf and reach the veins behind it.
 *
 * What is left is classified by thickness: the counters of "a" and "e" measure 16 pixels
 * across and are holes to make transparent, while the veins measure 1-2 and are drawn
 * detail that stays opaque.
 */
function backgroundMask(img, near) {
  const { width, height } = img;
  const total = width * height;

  // Dilate the ink mask so thin gaps between ink shapes become "near ink".
  const ink = new Uint8Array(total);
  for (let idx = 0; idx < total; idx++) ink[idx] = near(idx) ? 0 : 1;
  const nearInk = dilate(ink, width, height, CLOSE_RADIUS);

  const isBg = new Uint8Array(total);
  const stack = new Int32Array(total);
  let sp = 0;
  const push = (idx) => { if (!isBg[idx] && near(idx) && !nearInk[idx]) { isBg[idx] = 1; stack[sp++] = idx; } };
  for (let x = 0; x < width; x++) { push(x); push((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { push(y * width); push(y * width + width - 1); }
  while (sp > 0) {
    const idx = stack[--sp];
    const x = idx % width, y = (idx / width) | 0;
    if (x > 0) push(idx - 1);
    if (x < width - 1) push(idx + 1);
    if (y > 0) push(idx - width);
    if (y < height - 1) push(idx + width);
  }

  peelClosingBand(img, near, isBg, CLOSE_RADIUS);

  const keep = new Uint8Array(total);
  const seen = new Uint8Array(total);
  let holeRegions = 0, lineRegions = 0;
  for (let start = 0; start < total; start++) {
    if (seen[start] || isBg[start] || !near(start)) continue;
    seen[start] = 1;
    let head = 0, area = 0, perim = 0;
    const members = [];
    stack[head++] = start;
    while (head > 0) {
      const idx = stack[--head];
      members.push(idx); area++;
      const x = idx % width, y = (idx / width) | 0;
      for (const [dx, dy] of ORTHOGONAL) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) { perim++; continue; }
        const n = ny * width + nx;
        if (!near(n)) { perim++; continue; }
        if (isBg[n]) continue;
        if (!seen[n]) { seen[n] = 1; stack[head++] = n; }
      }
    }
    // 2*area/perimeter is the effective stroke width of the region.
    const thickness = perim > 0 ? (2 * area) / perim : area;
    if (thickness > LINE_MAX_THICKNESS) { for (const idx of members) isBg[idx] = 1; holeRegions++; }
    else { for (const idx of members) keep[idx] = 1; lineRegions++; }
  }
  return { isBg, keep, holeRegions, lineRegions };
}

/**
 * Grow the canvas inward over canvas-coloured pixels, up to `radius` steps, so the band
 * left around every silhouette by the closing is treated as canvas again. Propagation only
 * crosses canvas-coloured pixels, so it stops at solid ink and cannot reach drawn detail
 * that sits behind a stroke.
 */
function peelClosingBand({ width, height }, near, isBg, radius) {
  const total = width * height;
  const depth = new Uint8Array(total);
  const queue = new Int32Array(total);
  let tail = 0;
  const seed = (idx) => {
    if (isBg[idx] || depth[idx] || !near(idx)) return;
    depth[idx] = 1;
    queue[tail++] = idx;
  };
  for (let idx = 0; idx < total; idx++) {
    if (isBg[idx] || !near(idx)) continue;
    const x = idx % width, y = (idx / width) | 0;
    for (const [dx, dy] of ORTHOGONAL) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (isBg[ny * width + nx]) { seed(idx); break; }
    }
  }
  let head = 0;
  while (head < tail) {
    const idx = queue[head++];
    const d = depth[idx];
    if (d >= radius) continue;
    const x = idx % width, y = (idx / width) | 0;
    for (const [dx, dy] of ORTHOGONAL) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const n = ny * width + nx;
      if (isBg[n] || !near(n) || depth[n]) continue;
      depth[n] = d + 1;
      queue[tail++] = n;
    }
  }
  for (let idx = 0; idx < total; idx++) if (depth[idx]) isBg[idx] = 1;
}

const ORTHOGONAL = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Chebyshev dilation by a square radius, done as two 1-D max passes. */
function dilate(mask, width, height, radius) {
  const total = width * height;
  const tmp = new Uint8Array(total);
  const out = new Uint8Array(total);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    let count = 0;
    for (let x = 0; x < width; x++) if (mask[row + x]) count++;
    if (count === 0) { for (let x = 0; x < width; x++) tmp[row + x] = 0; continue; }
    for (let x = 0; x < width; x++) {
      let v = 0;
      for (let k = Math.max(0, x - radius); k <= Math.min(width - 1, x + radius); k++) {
        if (mask[row + k]) { v = 1; break; }
      }
      tmp[row + x] = v;
    }
  }
  for (let x = 0; x < width; x++) {
    let allZero = true;
    for (let y = 0; y < height; y++) if (tmp[y * width + x]) { allZero = false; break; }
    if (allZero) { for (let y = 0; y < height; y++) out[y * width + x] = 0; continue; }
    for (let y = 0; y < height; y++) {
      let v = 0;
      for (let k = Math.max(0, y - radius); k <= Math.min(height - 1, y + radius); k++) {
        if (tmp[k * width + x]) { v = 1; break; }
      }
      out[y * width + x] = v;
    }
  }
  return out;
}

/**
 * Ink palette: the most common colour buckets among artwork pixels that are *not*
 * canvas-coloured. The ring hugging every silhouette is within the background tolerance
 * (a 15% white blend on black canvas is still "near black"), so it must not be allowed to
 * become a palette entry — an ink solved against itself returns full coverage and paints
 * an opaque outline over every glyph.
 */
function palette({ width, height, channels, rgb }, isBg, near) {
  const buckets = new Map();
  for (let idx = 0; idx < width * height; idx++) {
    if (isBg[idx] || near(idx)) continue;
    const i = idx * channels;
    const key = `${rgb[i] >> 4},${rgb[i + 1] >> 4},${rgb[i + 2] >> 4}`;
    const e = buckets.get(key);
    if (e) e.n++;
    else buckets.set(key, { n: 1, r: rgb[i], g: rgb[i + 1], b: rgb[i + 2] });
  }
  const top = [...buckets.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 4);
  const inks = top.map(([key, e]) => {
    const [kr, kg, kb] = key.split(',').map(Number);
    // Re-accumulate the exact members of the bucket so the centre is the real colour.
    let r = 0, g = 0, b = 0, n = 0;
    for (let idx = 0; idx < width * height && n < e.n; idx++) {
      if (isBg[idx] || near(idx)) continue;
      const i = idx * channels;
      if ((rgb[i] >> 4) === kr && (rgb[i + 1] >> 4) === kg && (rgb[i + 2] >> 4) === kb) {
        r += rgb[i]; g += rgb[i + 1]; b += rgb[i + 2]; n++;
      }
    }
    return n ? [Math.round(r / n), Math.round(g / n), Math.round(b / n)] : [e.r << 4, e.g << 4, e.b << 4];
  });
  return inks;
}

/**
 * Chebyshev-style distance to the nearest background pixel, in source pixels.
 * Two passes over the image; costs 1 orthogonally and 2 diagonally, which is close
 * enough to tell "inside the artwork" from "on its silhouette".
 */
function distanceToBackground({ width, height }, isBg) {
  const total = width * height;
  const INF = 0x3fffffff;
  const d = new Int32Array(total);
  for (let i = 0; i < total; i++) d[i] = isBg[i] ? 0 : INF;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (d[idx] === 0) continue;
      let v = d[idx];
      if (x > 0) v = Math.min(v, d[idx - 1] + 1);
      if (y > 0) {
        if (x > 0) v = Math.min(v, d[idx - width - 1] + 2);
        v = Math.min(v, d[idx - width] + 1);
        if (x < width - 1) v = Math.min(v, d[idx - width + 1] + 2);
      }
      d[idx] = v;
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = width - 1; x >= 0; x--) {
      const idx = y * width + x;
      if (d[idx] === 0) continue;
      let v = d[idx];
      if (x < width - 1) v = Math.min(v, d[idx + 1] + 1);
      if (y < height - 1) {
        if (x > 0) v = Math.min(v, d[idx + width - 1] + 2);
        v = Math.min(v, d[idx + width] + 1);
        if (x < width - 1) v = Math.min(v, d[idx + width + 1] + 2);
      }
      d[idx] = v;
    }
  }
  return d;
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const build = (filterUp) => {
    const out = Buffer.alloc(height * (stride + 1));
    for (let y = 0; y < height; y++) {
      out[y * (stride + 1)] = filterUp ? 2 : 0;
      for (let x = 0; x < stride; x++) {
        const v = rgba[y * stride + x];
        out[y * (stride + 1) + 1 + x] = filterUp ? (v - (y > 0 ? rgba[(y - 1) * stride + x] : 0)) & 255 : v;
      }
    }
    return zlib.deflateSync(out, { level: 9 });
  };
  const raw0 = build(false), raw2 = build(true);
  const idat = raw0.length <= raw2.length ? raw0 : raw2;
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0, 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, truecolour with alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

let CRC_TABLE = null;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

function derive(srcFile, outFile) {
  const img = decodePng(srcFile);
  const { width, height, channels, rgb } = img;
  const bg = edgeBackground(img);
  const near = nearBackground(img, bg);
  const { isBg, keep, holeRegions, lineRegions } = backgroundMask(img, near);
  const inks = palette(img, isBg, near).slice(0, 3);

  // Drop inks indistinguishable from the background: they cannot be solved for coverage.
  const usable = inks.filter((c) => Math.abs(c[0] - bg[0]) + Math.abs(c[1] - bg[1]) + Math.abs(c[2] - bg[2]) > 24);

  const dist = distanceToBackground(img, isBg);
  const rgba = Buffer.alloc(width * height * 4);
  let transparent = 0, interior = 0, edgeSolid = 0, edgeBlended = 0, sealedBg = 0;
  for (let idx = 0; idx < width * height; idx++) {
    const i = idx * channels, o = idx * 4;
    if (isBg[idx]) { rgba[o + 3] = 0; transparent++; continue; }
    const r = rgb[i], g = rgb[i + 1], b = rgb[i + 2];
    // Drawn detail that shares the canvas colour (the leaf veins) is artwork, and so is
    // anything deeper than the edge band: those pixels keep the colour they were drawn
    // with. Treating the veins as a blend against the canvas would make them translucent.
    if (keep[idx] || dist[idx] > BAND) {
      rgba[o] = r; rgba[o + 1] = g; rgba[o + 2] = b; rgba[o + 3] = 255;
      interior++;
      continue;
    }
    // On the silhouette, solve coverage against the canvas so the edge composites correctly
    // on any surface instead of carrying a halo of the old background colour.
    let best = null;
    for (const ink of usable) {
      // Solve coverage on the channel where ink and background differ most.
      const dr = Math.abs(ink[0] - bg[0]), dg = Math.abs(ink[1] - bg[1]), db = Math.abs(ink[2] - bg[2]);
      const k = dr >= dg && dr >= db ? 0 : dg >= db ? 1 : 2;
      const denom = [dr, dg, db][k];
      if (denom === 0) continue;
      const obs = [r, g, b][k];
      const a = Math.max(0, Math.min(1, (obs - bg[k]) / (ink[k] - bg[k])));
      const err =
        Math.abs(a * ink[0] + (1 - a) * bg[0] - r) +
        Math.abs(a * ink[1] + (1 - a) * bg[1] - g) +
        Math.abs(a * ink[2] + (1 - a) * bg[2] - b);
      // Prefer a higher-coverage fit when two inks explain the pixel equally well.
      if (!best || err < best.err - FIT_TOLERANCE || (Math.abs(err - best.err) <= FIT_TOLERANCE && a > best.a)) {
        best = { ink, a, err };
      }
    }
    if (!best) {
      rgba[o] = r; rgba[o + 1] = g; rgba[o + 2] = b; rgba[o + 3] = 255;
      edgeSolid++;
      continue;
    }
    // Nothing left of the ink at this coverage means the pixel is canvas, not a tapered
    // edge: make it transparent rather than opaque in the canvas colour.
    if (best.a <= MIN_COVERAGE) { rgba[o + 3] = 0; sealedBg++; continue; }
    const alpha = Math.round(best.a * 255);
    rgba[o] = best.ink[0]; rgba[o + 1] = best.ink[1]; rgba[o + 2] = best.ink[2]; rgba[o + 3] = alpha;
    if (alpha === 255) edgeSolid++; else edgeBlended++;
  }

  // Trim to the visible ink box; the sources carry ~90% empty, off-centre canvas.
  let minX = width, maxX = -1, minY = height, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] === 0) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  minX = Math.max(0, minX - PAD); minY = Math.max(0, minY - PAD);
  maxX = Math.min(width - 1, maxX + PAD); maxY = Math.min(height - 1, maxY + PAD);
  const tw = maxX - minX + 1, th = maxY - minY + 1;
  const trimmed = Buffer.alloc(tw * th * 4);
  for (let y = 0; y < th; y++) {
    rgba.copy(trimmed, y * tw * 4, ((y + minY) * width + minX) * 4, ((y + minY) * width + minX) * 4 + tw * 4);
  }
  const png = encodePng(tw, th, trimmed);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, png);

  const totalPx = width * height;
  console.log(
    `${path.basename(srcFile)} -> ${path.basename(outFile)}  ` +
    `${width}x${height} bg=${bg.join('/')} -> ${tw}x${th} (${(tw / th).toFixed(3)}:1) ` +
    `${(png.length / 1024).toFixed(1)} KiB  ` +
    `cleared ${((100 * transparent) / totalPx).toFixed(1)}%  solid ${((100 * (interior + edgeSolid)) / totalPx).toFixed(2)}% (interior ${((100 * interior) / totalPx).toFixed(2)}%)  edge-blend ${((100 * edgeBlended) / totalPx).toFixed(2)}%  fit-cleared ${((100 * sealedBg) / totalPx).toFixed(2)}%  ` +
    `letter-holes ${holeRegions}  vein-strokes ${lineRegions}  ` +
    `inks=${inks.map((c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')).join(' ')}`,
  );
  return { tw, th, bytes: png.length };
}

const results = PLAN.map(([src, out]) =>
  derive(path.join(SRC_DIR, src), path.join(OUT_DIR, out)));

console.log('\nDerived set:');
for (const [i, r] of results.entries()) {
  console.log(`  ${PLAN[i][1].padEnd(24)} ${r.tw}x${r.th}  ${(r.bytes / 1024).toFixed(1)} KiB`);
}
