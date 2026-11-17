// Runs automatically before `npm run dev` / `npm run build`.
//  1. Converts every HEIC/HEIF in src/gallery to JPG (the capture date is kept, the HEIC is deleted).
//  2. Renames ALL images (old + new) oldest -> newest as 1, 2, 3 ... (each folder counts from 1).
//  3. Remembers every file in src/gallery-names.json (original name + capture date), so
//     later runs keep the old photos in place and slot new photos in by their date,
//     and so captions from site.js (keyed by the original name) keep working.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import convert from "heic-convert";

const ROOT = path.resolve("src/gallery");
const MANIFEST = path.resolve("src/gallery-names.json");
const IMG = /\.(jpe?g|jpe|jfif|pjpeg|pjp|png|apng|gif|webp|avif|svg|bmp|ico|cur|tiff?)$/i;
const HEIC = /\.(heic|heif)$/i;
const START = 1;

let exifr = null;
try { exifr = (await import("exifr")).default; }
catch { console.warn("! exifr not installed (run `npm install`): using file modified time for dates."); }

const exists = (p) => fs.access(p).then(() => true, () => false);
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

async function captureDate(file, buf) {
  if (!exifr) return null;
  try {
    const d = await exifr.parse(buf ?? (await fs.readFile(file)), ["DateTimeOriginal", "CreateDate", "ModifyDate"]);
    for (const k of ["DateTimeOriginal", "CreateDate", "ModifyDate"]) {
      const v = d?.[k];
      if (v instanceof Date && !isNaN(v) && v.getFullYear() > 1990) return v;
    }
  } catch { /* no usable metadata */ }
  return null;
}

if (!(await exists(ROOT))) { console.log("No src/gallery folder."); process.exit(0); }

// ---------- 1. HEIC -> JPG ----------
const heics = (await walk(ROOT)).filter((f) => HEIC.test(f));
if (heics.length) console.log(`Converting ${heics.length} HEIC file(s)...`);
for (const f of heics) {
  const dir = path.dirname(f);
  const stem = path.basename(f).replace(/\.[^.]+$/, "");
  let target = path.join(dir, `${stem}.jpg`);
  for (let i = 1; await exists(target); i++) target = path.join(dir, `${stem}-heic${i > 1 ? i : ""}.jpg`);
  try {
    const buf = await fs.readFile(f);
    const taken = (await captureDate(f, buf)) ?? (await fs.stat(f)).mtime;
    const out = await convert({ buffer: buf, format: "JPEG", quality: 0.9 });
    await fs.writeFile(target, Buffer.from(out));
    if ((await fs.stat(target)).size === 0) throw new Error("empty output, original kept");
    await fs.utimes(target, taken, taken); // the JPG inherits the HEIC's capture date
    await fs.unlink(f);
    console.log("  ✓", path.basename(f), "→", path.basename(target));
  } catch (e) { console.error("  ✗", path.basename(f), e.message); }
}

// ---------- 2. rename by date ----------
let manifest = { files: {} };
try { manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8")); } catch { /* first run */ }
manifest.files ||= {};

const all = (await walk(ROOT)).filter((f) => IMG.test(f));
const byDir = new Map();
for (const f of all) {
  const d = path.dirname(f);
  if (!byDir.has(d)) byDir.set(d, []);
  byDir.get(d).push(f);
}

const next = { files: {} };
const plan = []; // {from, to, tmp}
let fresh = 0;

for (const [dir, files] of byDir) {
  const entries = [];
  for (const f of files) {
    const st = await fs.stat(f);
    const key = rel(f);
    const known = manifest.files[key];
    const sameFile = known && known.size === st.size && known.mtime === Math.floor(st.mtimeMs);
    let orig, date;
    if (sameFile) { orig = known.orig; date = new Date(known.date); }
    else {
      fresh++;
      orig = path.basename(f).replace(/\.[^.]+$/, "");
      date = (await captureDate(f)) ?? st.mtime;
    }
    entries.push({ f, st, orig, date });
  }
  entries.sort((a, b) => a.date - b.date || a.orig.localeCompare(b.orig, undefined, { numeric: true }));
  entries.forEach((e, i) => {
    const name = `${START + i}${path.extname(e.f).toLowerCase()}`;
    const to = path.join(dir, name);
    next.files[rel(to)] = { orig: e.orig, date: e.date.toISOString(), size: e.st.size, mtime: Math.floor(e.st.mtimeMs) };
    if (to !== e.f) plan.push({ from: e.f, to });
  });
}

if (plan.length) {
  // two phases so names never collide (e.g. 2 -> 1 while 1 -> 2)
  const token = crypto.randomBytes(4).toString("hex");
  const tmps = [];
  for (const [i, p] of plan.entries()) {
    const tmp = path.join(path.dirname(p.from), `.tmp_${token}_${i}${path.extname(p.from)}`);
    await fs.rename(p.from, tmp);
    tmps.push(tmp);
  }
  for (const [i, p] of plan.entries()) await fs.rename(tmps[i], p.to);
}

await fs.writeFile(MANIFEST, JSON.stringify(next, null, 2) + "\n");
const total = Object.keys(next.files).length;
console.log(total ? `Gallery: ${total} image(s), ${fresh} new, ${plan.length} renamed (oldest = ${START}).` : "No images in src/gallery.");
