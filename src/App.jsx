import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { InfiniteGallery } from "motion-brew/infinite-gallery";
import { DepthCarousel } from "motion-brew/depth-carousel";
import { PrismCarousel } from "motion-brew/prism-carousel";
import { ProjectIndex } from "motion-brew/project-index";
import { DuoFlip } from "@/components/duo-flip";
import { images } from "./gallery";
import { site } from "./site";
import ThemeToggle from "./components/ThemeToggle";
import { useDark } from "./theme";
import { Grid } from "./components/Grid";
import { Showcase } from "./components/Showcase";
import { Lightbox } from "./components/Lightbox";
import { RibbonGallery } from "./components/RibbonGallery";
import { TiltCarousel } from "./components/tilt-carousel";

// To add a style: import it, add one entry here. `lightbox: true` = clicking a picture opens the full-size viewer.
const STYLES = [
  { id: "grid", name: "Grid", lightbox: true, render: (p) => <Grid {...p} /> },
  { id: "showcase", name: "Showcase", lightbox: true, render: (p) => <Showcase {...p} /> },
  { id: "duo", name: "Duo flip", frame: true, render: ({ items }) => <div className="mx-auto w-full max-w-4xl px-4 py-16"><DuoFlip images={items} /></div> },
  { id: "ribbon", name: "Ribbon", frame: true, render: ({ items, dark }) => <RibbonGallery items={items} label="Photo ribbon" dimColor={dark ? "rgb(14 15 26)" : "rgb(243 244 247)"} /> },
  { id: "tilt", name: "Tilt", frame: true, render: ({ items }) => <div className="py-14"><TiltCarousel items={items} cardWidth={300} cardHeight={200} label="Photo carousel" /></div> },
  { id: "infinite", name: "Infinite", frame: true, render: ({ items }) => <InfiniteGallery items={items} className="h-[72vh] min-h-[420px]" /> },
  { id: "depth", name: "Depth", frame: true, render: ({ items }) => <DepthCarousel items={items} className="h-[72vh] min-h-[420px]" /> },
  { id: "prism", name: "Prism", frame: true, render: ({ items }) => <PrismCarousel cards={items.map((i) => ({ label: i.title, image: i.src, caption: i.meta }))} /> },
  { id: "index", name: "Index", lightbox: true, render: ({ items, onOpen }) => (
    <ProjectIndex projects={items.map((i) => ({ title: i.title, meta: i.meta, image: i.src, alt: i.alt }))} onOpen={(_, idx) => onOpen(idx)} />) },
];

export default function App() {
  const [style, setStyle] = useState(() => { try { return localStorage.getItem("gallery-style"); } catch { return null; } });
  const [open, setOpen] = useState(null);
  const dark = useDark();
  const cur = STYLES.find((s) => s.id === style) || STYLES[0];
  useEffect(() => { try { localStorage.setItem("gallery-style", cur.id); } catch {} }, [cur.id]);
  const close = useCallback(() => setOpen(null), []);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-12">
      <header className="mb-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold sm:text-5xl">{site.name}</h1>
            <p className="mt-2 max-w-xl text-base text-ink/70 sm:text-lg">{site.tagline}</p>
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
        <p className="rounded-2xl border border-dashed border-zinc-400/50 p-10 text-center text-zinc-500">No images yet. Put your photos in <code>src/gallery/</code>.</p>
      ) : (
        <motion.section key={cur.id} aria-label={cur.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className={`relative isolate overflow-hidden rounded-[2rem] ${cur.frame ? "border border-ink/10 bg-surface/50" : ""}`}>
          {cur.render({ items: images, onOpen: setOpen, dark })}
        </motion.section>
      )}
      {cur.lightbox && <Lightbox items={images} index={open} onClose={close} onChange={setOpen} />}

      <footer className="mt-20 grid gap-8 border-t border-ink/10 pt-10 sm:grid-cols-2">
        <div>
          <p className="font-display text-xl font-semibold">{site.name}</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink/70">{site.bio}</p>
          <a className="mt-3 inline-block text-sm underline underline-offset-4" href={`mailto:${site.email}`}>{site.email}</a>
        </div>
        <ul className="flex flex-wrap content-start gap-2 sm:justify-end">
          {site.social.map((s) => (
            <li key={s.name}>
              <a className="block rounded-full border border-ink/15 px-3.5 py-1.5 text-sm transition-colors hover:bg-ink/[0.06]" href={s.href} target="_blank" rel="noreferrer">{s.name}</a>
            </li>
          ))}
        </ul>
      </footer>
    </main>
  );
}
