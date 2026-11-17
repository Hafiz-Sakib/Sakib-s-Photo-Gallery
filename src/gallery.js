// Every image dropped into src/gallery (any sub-folder) shows up automatically. No code changes needed.
// On `npm run dev` they are renamed 1, 2, 3 ... by capture date (see scripts/prepare-gallery.mjs).
// Both lower and UPPER case extensions are matched.
const files = import.meta.glob("/src/gallery/**/*.{jpg,jpeg,jpe,jfif,pjpeg,pjp,png,apng,gif,webp,avif,svg,bmp,ico,cur,tif,tiff,heic,heif,JPG,JPEG,JPE,JFIF,PJPEG,PJP,PNG,APNG,GIF,WEBP,AVIF,SVG,BMP,ICO,CUR,TIF,TIFF,HEIC,HEIF}", { eager: true, query: "?url", import: "default" });

import { site } from "./site";
import names from "./gallery-names.json"; // written by scripts/prepare-gallery.mjs (1.jpg -> original file name)

const clean = (n) => n.replace(/\.[^.]+$/, "");
const stem = (n) => clean(n).replace(/^\d+[-_\s]*/, "");
const pretty = (n) => clean(n).replace(/[-_]+/g, " ").replace(/^\d+\s*/, "").trim();
// Photos get renamed to 1, 2, 3 ..., so captions/titles come from the ORIGINAL file name kept in the manifest.
const original = (p) => names.files?.[p.replace("/src/gallery/", "")]?.orig ?? p.split("/").pop();

export const images = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, src]) => {
    const o = original(path);
    const [t, meta] = site.titles?.[stem(o)] || [];
    // numeric-only names (e.g. 7.jpg, no known original) get a generic title
    const title = t || (/^\d+$/.test(clean(o)) ? "Photo" : pretty(o)) || "Photo";
    // href makes Ribbon / Tilt cards open the full image in a new tab.
    return { src, title, label: title, alt: title, meta, caption: meta, href: src };
  });
