import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { images } from "./gallery";
import { site } from "./site";
import { Icon } from "./components/icons";
import ThemeToggle from "./components/ThemeToggle";
import { useDark } from "./theme";
import { Grid } from "./components/Grid";
import { Showcase } from "./components/Showcase";
import { Lightbox } from "./components/Lightbox";

// Each style is its own chunk: three.js / gsap / motion-brew are only downloaded when that style is opened.
const lazyNamed = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })));
const InfiniteGallery = lazyNamed(() => import("motion-brew/infinite-gallery"), "InfiniteGallery");
const DepthCarousel = lazyNamed(() => import("motion-brew/depth-carousel"), "DepthCarousel");
const PrismCarousel = lazyNamed(() => import("motion-brew/prism-carousel"), "PrismCarousel");
const DuoFlip = lazyNamed(() => import("./components/duo-flip"), "DuoFlip");
const RibbonGallery = lazyNamed(() => import("./components/RibbonGallery"), "RibbonGallery");
const TiltCarousel = lazyNamed(() => import("./components/tilt-carousel"), "TiltCarousel");

// Grid and Showcase show every photo (lazy-loaded). The animated styles use only FEATURED random photos so 500 pictures never choke them.
const FEATURED = 60;
// Random order: a fresh shuffle on every page load, shared by all styles (so the lightbox always matches what you clicked).
const shuffle = (list) => { const r = list.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const shuffled = shuffle(images);
const featured = shuffled.slice(0, FEATURED);

// Card sizes follow the width of the gallery box (the page is at most 1152px wide), so pictures never look small inside it.
const cl = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const useWidth = () => {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => { const f = () => setW(window.innerWidth); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return Math.min(w, 1152);
};

// To add a style: import it, add one entry here. `lightbox: true` = clicking a picture opens the full-size viewer.
const STYLES = [
  { id: "grid", name: "Grid", all: true, lightbox: true, render: (p) => <Grid {...p} /> },
  { id: "showcase", name: "Showcase", all: true, lightbox: true, render: (p) => <Showcase {...p} /> },
  { id: "duo", name: "Duo flip", frame: true, render: ({ items }) => <div className="mx-auto w-full px-4 py-16" style={{ maxWidth: "min(56rem, calc((100svh - 14rem) * 1.25))" }}><DuoFlip images={items} className="w-full" /></div> },
  { id: "ribbon", name: "Ribbon", frame: true, render: ({ items, dark, w }) => <RibbonGallery items={items} cardWidth={cl(Math.round(w * 0.22), 180, 290)} cardHeight={Math.round(cl(Math.round(w * 0.22), 180, 290) * 1.26)} label="Photo ribbon" dimColor={dark ? "rgb(14 15 26)" : "rgb(243 244 247)"} /> },
  { id: "tilt", name: "Tilt", frame: true, render: ({ items, w }) => <div className="py-14"><TiltCarousel items={items} cardWidth={cl(Math.round(w * 0.32), 230, 400)} cardHeight={Math.round(cl(Math.round(w * 0.32), 230, 400) * 0.66)} label="Photo carousel" /></div> },
  { id: "infinite", name: "Infinite", frame: true, render: ({ items }) => <InfiniteGallery items={items} showTitles={false} className="h-[72vh] min-h-[420px]" /> },
  { id: "depth", name: "Depth", frame: true, render: ({ items }) => <DepthCarousel items={items} className="h-[72vh] min-h-[420px]" /> },
  { id: "prism", name: "Prism", frame: true, render: ({ items }) => <PrismCarousel cards={items.map((i) => ({ label: "", image: i.src }))} /> },
];

const year = new Date().getFullYear();
const insta = site.social.find((x) => x.name === "Instagram");

export default function App() {
  const [style, setStyle] = useState(() => { try { return localStorage.getItem("gallery-style"); } catch { return null; } });
  const [open, setOpen] = useState(null);
  const dark = useDark();
  const w = useWidth();
  const cur = STYLES.find((s) => s.id === style) || STYLES[0];
  const list = cur.all ? shuffled : featured;
  useEffect(() => { try { localStorage.setItem("gallery-style", cur.id); } catch {} }, [cur.id]);
  const close = useCallback(() => setOpen(null), []);

  return (
    <main id="top" className="mx-auto max-w-6xl px-5 pb-4 pt-12 lg:pb-8">
      <header className="mb-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 font-display text-3xl font-semibold sm:gap-4 sm:text-5xl">
              <img src="/favicon.svg" alt="" width="48" height="48" className="h-9 w-9 shrink-0 rounded-[22%] sm:h-12 sm:w-12" />
              <span>{site.title}</span>
            </h1>
            <p className="mt-2 max-w-xl text-base text-ink/70 sm:text-lg">{site.name} · {site.tagline}</p>
            <p className="mt-1 text-sm text-ink/50">{site.place}</p>
          </div>
          <ThemeToggle className="mt-1" />
        </div>
        <nav aria-label="Gallery style" className="mt-8 flex justify-start sm:justify-center">
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-full bg-ink/[0.07] p-1 [scrollbar-width:none]">
            {STYLES.map((s) => (
              <button key={s.id} onClick={() => setStyle(s.id)} className="relative shrink-0 rounded-full px-4 py-1.5 text-sm font-medium">
                {cur.id === s.id && <motion.span layoutId="pill" className="absolute inset-0 rounded-full bg-surface shadow-md" transition={{ type: "spring", stiffness: 500, damping: 34 }} />}
                <span className="relative">{s.name}</span>
              </button>
            ))}
          </div>
        </nav>
      </header>

      {images.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-400/50 p-10 text-center text-zinc-500">No images yet. Put your photos in the <code>photos/</code> folder and run <code>npm run dev</code>.</p>
      ) : (
        <motion.section key={cur.id} aria-label={cur.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className={`clean-captions relative isolate overflow-hidden rounded-[2rem] ${cur.frame ? "border border-ink/10 bg-surface/50" : ""}`}>
          <Suspense fallback={<div className="grid h-[50vh] place-items-center text-sm text-ink/50">Loading…</div>}>
            {cur.render({ items: list, onOpen: setOpen, dark, w })}
          </Suspense>
        </motion.section>
      )}
      {!cur.all && images.length > FEATURED && <p className="mt-3 text-center text-sm text-ink/50">Showing {FEATURED} random photos of {images.length}. Grid and Showcase show all of them.</p>}
      {cur.lightbox && <Lightbox items={list} index={open} onClose={close} onChange={setOpen} />}

      <footer className="mt-10 border-t border-ink/10 pb-2 pt-7 sm:mt-12 sm:pt-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <a href={insta.href} target="_blank" rel="noreferrer" aria-label={`© ${year} ${site.full}. Open Instagram`} className="group inline-flex max-w-full flex-col items-start gap-2">
              {/* © year chip: slides to the Instagram handle on hover or focus */}
              <span aria-hidden className="relative inline-grid overflow-hidden rounded-full bg-ink/[.06] px-3 py-1 text-xs font-semibold text-ink/60 transition-colors duration-300 group-hover:bg-ink/10 group-hover:text-ink group-focus-visible:bg-ink/10 group-focus-visible:text-ink">
                <span className="col-start-1 row-start-1 transition duration-300 group-hover:-translate-y-full group-hover:opacity-0 group-focus-visible:-translate-y-full group-focus-visible:opacity-0">© {year}</span>
                <span className="col-start-1 row-start-1 inline-flex translate-y-full items-center gap-1.5 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"><Icon name="Instagram" className="h-3 w-3" />Follow on Instagram</span>
              </span>
              <span className="inline-flex max-w-full items-center gap-2.5 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                <span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-[length:0%_3px] bg-[position:0_100%] bg-no-repeat pb-0.5 transition-[background-size] duration-500 ease-out group-hover:bg-[length:100%_3px] group-focus-visible:bg-[length:100%_3px]">{site.full}</span>
                <Icon name="Instagram" className="h-5 w-5 -translate-x-1 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" />
              </span>
            </a>
            <p className="mt-2 max-w-md text-ink/60">Full-stack developer and NLP researcher in {site.place}.</p>
          </div>
          <ul className="grid grid-cols-8 gap-1.5 sm:flex sm:flex-wrap sm:gap-2" aria-label="Social links">
            {site.social.map((s) => (
              <li key={s.name}>
                <a href={s.href} target="_blank" rel="noreferrer" aria-label={s.name} title={s.name} className="grid aspect-square w-full place-items-center rounded-full bg-surface shadow-sm sm:h-11 sm:w-11 ring-1 ring-ink/[.08] transition duration-200 hover:-translate-y-1 hover:shadow-md">
                  <Icon name={s.name} className="h-5 w-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex flex-row items-center justify-between gap-4 text-sm text-ink/55">
          <p>All rights reserved.</p>
          <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="group inline-flex items-center gap-2 rounded-full bg-ink/[.06] px-4 py-2 font-semibold text-ink/70 transition-colors hover:bg-ink/10 hover:text-ink">
            Back to top
            <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
          </a>
        </div>
      </footer>
    </main>
  );
}
