// Every image dropped into src/gallery (any sub-folder) shows up automatically. No code changes needed.
// Both lower and UPPER case extensions are matched.
const files = import.meta.glob("/src/gallery/**/*.{jpg,jpeg,jpe,jfif,pjpeg,pjp,png,apng,gif,webp,avif,svg,bmp,ico,cur,tif,tiff,heic,heif,JPG,JPEG,JPE,JFIF,PJPEG,PJP,PNG,APNG,GIF,WEBP,AVIF,SVG,BMP,ICO,CUR,TIF,TIFF,HEIC,HEIF}", { eager: true, query: "?url", import: "default" });

import { site } from "./site";

const stem = (p) => p.split("/").pop().replace(/\.[^.]+$/, "").replace(/^\d+[-_\s]*/, "");
const pretty = (p) => p.split("/").pop().replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/^\d+\s*/, "").trim();

export const images = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, src]) => {
    const [t, meta] = site.titles?.[stem(path)] || [];
    const title = t || pretty(path) || "Photo";
    // href makes Ribbon / Tilt cards open the full image in a new tab.
    return { src, title, label: title, alt: title, meta, caption: meta, href: src };
  });
