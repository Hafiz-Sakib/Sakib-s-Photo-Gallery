// Converts every HEIC/HEIF in src/gallery (any sub-folder) to JPEG so all browsers can show it.
// After a successful conversion the original HEIC is DELETED (so the repo stays small).
import fs from "node:fs/promises";
import path from "node:path";
import convert from "heic-convert";

const ROOT = path.resolve("src/gallery");
const isHeic = (f) => /\.(heic|heif)$/i.test(f);

async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (isHeic(e.name)) out.push(p);
  }
  return out;
}
const exists = (p) => fs.access(p).then(() => true, () => false);

const files = await walk(ROOT);
if (!files.length) { console.log("No HEIC files to convert."); process.exit(0); }
console.log(`Converting ${files.length} HEIC file(s)...`);

let ok = 0, fail = 0;
for (const f of files) {
  const dir = path.dirname(f);
  const stem = path.basename(f).replace(/\.[^.]+$/, "");
  let target = path.join(dir, `${stem}.jpg`);
  for (let i = 1; await exists(target); i++) target = path.join(dir, `${stem}-heic${i > 1 ? i : ""}.jpg`);
  try {
    const out = await convert({ buffer: await fs.readFile(f), format: "JPEG", quality: 0.9 });
    await fs.writeFile(target, Buffer.from(out));
    if ((await fs.stat(target)).size === 0) throw new Error("empty output, original kept");
    await fs.unlink(f);
    ok++; console.log("  ✓", path.basename(f), "→", path.basename(target));
  } catch (e) { fail++; console.error("  ✗", path.basename(f), e.message); }
}
console.log(`Done: ${ok} converted, ${fail} failed.  Original HEIC files deleted.`);
