// Runs before `npm run dev` / `npm run build` (skipped on Vercel/CI: it deploys what is committed).
//
//   photos/            <- DROP any photo here (jpg png webp avif tiff gif svg HEIC ...). Not committed to git.
//   originals/         <- your untouched originals are moved here after processing (backup, not committed).
//   public/gallery/    <- generated + committed: full/ (1600px), medium/ (900px), thumb/ (400px), all WebP.
//
// What it does:
//   1. HEIC/HEIF -> decoded to JPEG in memory (capture date read first, because conversion drops EXIF).
//   2. Every new photo -> auto-rotated, resized, WebP, privacy-stripped (no GPS/EXIF) in 3 sizes.
//   3. ALL photos (old + new) are renamed oldest -> newest by capture date: 1.webp, 2.webp, 3.webp ...
//   4. src/gallery-meta.json (tiny, used by the site) and scripts/gallery-state.json (dates etc.) are updated.
// Re-tune sizes: edit TIERS below, then run `npm run gallery:rebuild` (re-processes everything in originals/).
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

if (process.env.VERCEL || process.env.CI) {
  console.log("Gallery: CI/Vercel build, using the committed images (prepare step skipped).");
  process.exit(0);
}

const TIERS = {
  full:   { width: 1600, quality: 78 }, // lightbox / "open full image"
  medium: { width: 900,  quality: 74 }, // carousels, ribbon, showcase
  thumb:  { width: 400,  quality: 70 }, // grid, thumbnails
};
const BUDGET_MB = 95; // Vercel Hobby lists a 100 MB static-upload limit
const START = 1;

const INBOX = path.resolve("photos");
const BACKUP = path.resolve("originals");
const OUT = path.resolve("public/gallery");
const STATE = path.resolve("scripts/gallery-state.json");
const META = path.resolve("src/gallery-meta.json");
const ACCEPT = /\.(jpe?g|jpe|jfif|pjpeg|pjp|png|apng|gif|webp|avif|bmp|tiff?|svg|heic|heif)$/i;
const HEIC = /\.(heic|heif)$/i;
const REBUILD = process.argv.includes("--rebuild");

const tierNames = Object.keys(TIERS);
const file = (tier, name) => path.join(OUT, tier, `${name}.webp`);
const exists = (p) => fs.access(p).then(() => true, () => false);
const sha1 = (b) => crypto.createHash("sha1").update(b).digest("hex");
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true });

let sharp;
try { sharp = (await import("sharp")).default; }
catch { console.error("sharp is not installed. Run `npm install` first."); process.exit(1); }
let exifr = null;
try { exifr = (await import("exifr")).default; }
catch { console.warn("! exifr not installed (run `npm install`): using file modified time for dates."); }

async function walk(dir) {
  const out = [];
  if (!(await exists(dir))) return out;
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

async function captureDate(buf) {
  if (!exifr) return null;
  try {
    const d = await exifr.parse(buf, ["DateTimeOriginal", "CreateDate", "ModifyDate"]);
    for (const k of ["DateTimeOriginal", "CreateDate", "ModifyDate"]) {
      const v = d?.[k];
      if (v instanceof Date && !isNaN(v) && v.getFullYear() > 1990) return v;
    }
  } catch { /* no usable metadata */ }
  return null;
}

async function moveTo(src, dir) {
  await fs.mkdir(dir, { recursive: true });
  const base = path.basename(src), ext = path.extname(base), stem = base.slice(0, base.length - ext.length);
  let dest = path.join(dir, base);
  for (let i = 2; await exists(dest); i++) dest = path.join(dir, `${stem}-${i}${ext}`);
  try { await fs.rename(src, dest); }
  catch { await fs.copyFile(src, dest); await fs.unlink(src); }
}

for (const t of tierNames) await fs.mkdir(path.join(OUT, t), { recursive: true });
await fs.mkdir(INBOX, { recursive: true });
await fs.mkdir(path.dirname(STATE), { recursive: true });

// ---------- --rebuild: put originals back in the inbox and start from scratch ----------
if (REBUILD) {
  for (const f of await walk(BACKUP)) await moveTo(f, INBOX);
  for (const t of tierNames) { await fs.rm(path.join(OUT, t), { recursive: true, force: true }); await fs.mkdir(path.join(OUT, t), { recursive: true }); }
  await fs.rm(STATE, { force: true });
  console.log("Rebuild: originals moved back to photos/, generated images cleared.");
}

let state = { items: [] };
try { state = JSON.parse(await fs.readFile(STATE, "utf8")); } catch { /* first run */ }

// ---------- 1. forget photos whose files were deleted by hand ----------
const kept = [];
for (const it of state.items) {
  if (await exists(file("full", it.file))) kept.push(it);
  else { for (const t of tierNames) await fs.rm(file(t, it.file), { force: true }); console.log("  - removed from gallery:", it.file, `(${it.orig})`); }
}
const removed = state.items.length - kept.length;
state.items = kept;

// ---------- 2. process new photos from the inbox ----------
const inbox = (await walk(INBOX)).filter((f) => ACCEPT.test(f)).sort(natural);
const knownHashes = new Set(state.items.map((i) => i.hash));
let added = 0, dupes = 0, failed = 0;
if (inbox.length) console.log(`Processing ${inbox.length} new photo(s)...`);

for (const f of inbox) {
  const name = path.basename(f);
  try {
    const raw = await fs.readFile(f);
    const hash = sha1(raw);
    if (knownHashes.has(hash)) { await moveTo(f, BACKUP); dupes++; console.log("  = already in gallery, skipped:", name); continue; }

    let input = raw;
    if (HEIC.test(name)) {
      const { default: convert } = await import("heic-convert");
      input = Buffer.from(await convert({ buffer: raw, format: "JPEG", quality: 0.95 }));
    }
    const date = (await captureDate(raw)) ?? (await fs.stat(f)).mtime;

    const base = sharp(input, { failOn: "none" }).rotate(); // .rotate() = apply EXIF orientation
    const prov = `_new_${hash.slice(0, 10)}`;                // provisional name, renamed in step 3
    let full;
    for (const [tier, { width, quality }] of Object.entries(TIERS)) {
      const r = await base.clone().resize({ width, height: width, fit: "inside", withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer({ resolveWithObject: true });
      if (!r.data.length) throw new Error("empty output");
      await fs.writeFile(file(tier, prov), r.data);
      if (tier === "full") full = r;
    }
    state.items.push({
      file: prov,
      orig: name.replace(/\.[^.]+$/, ""),
      date: date.toISOString(),
      hash,
      v: sha1(full.data).slice(0, 6),
      w: full.info.width,
      h: full.info.height,
    });
    knownHashes.add(hash);
    await moveTo(f, BACKUP); // only after everything was written successfully
    added++; console.log("  ✓", name);
  } catch (e) { failed++; console.error("  ✗", name, "-", e.message, "(left in photos/)"); }
}

// ---------- 3. rename everything oldest -> newest: 1, 2, 3 ... ----------
state.items.sort((a, b) => new Date(a.date) - new Date(b.date) || natural(a.orig, b.orig));
const moves = state.items.map((it, i) => ({ it, to: String(START + i) })).filter((m) => m.it.file !== m.to);
if (moves.length) {
  const token = crypto.randomBytes(4).toString("hex"); // two phases so 2->1 and 1->2 never collide
  for (const [k, m] of moves.entries()) for (const t of tierNames) await fs.rename(file(t, m.it.file), path.join(OUT, t, `.tmp_${token}_${k}.webp`));
  for (const [k, m] of moves.entries()) {
    for (const t of tierNames) await fs.rename(path.join(OUT, t, `.tmp_${token}_${k}.webp`), file(t, m.to));
    m.it.file = m.to;
  }
}

// ---------- 4. write data files ----------
const line = (it) => "    " + JSON.stringify(it);
await fs.writeFile(STATE, `{\n  "items": [\n${state.items.map(line).join(",\n")}\n  ]\n}\n`);
await fs.writeFile(META, JSON.stringify(state.items.map((it) => [it.orig, it.w, it.h, it.v])) + "\n");

let bytes = 0;
for (const it of state.items) for (const t of tierNames) bytes += (await fs.stat(file(t, it.file)).catch(() => ({ size: 0 }))).size;
const mb = bytes / 1048576;
if (!state.items.length) console.log("Gallery is empty. Drop photos into the photos/ folder.");
else console.log(`Gallery: ${state.items.length} photo(s), ${mb.toFixed(1)} MB in public/gallery  (+${added} new, ${dupes} duplicate, ${removed} removed, ${moves.length} renamed, ${failed} failed)`);
if (mb > BUDGET_MB) console.warn(`! ${mb.toFixed(0)} MB is above the ~${BUDGET_MB} MB budget. Lower width/quality in TIERS (top of scripts/prepare-gallery.mjs) and run \`npm run gallery:rebuild\`.`);
