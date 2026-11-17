import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { InfiniteGallery } from "motion-brew/infinite-gallery";
import { DepthCarousel } from "motion-brew/depth-carousel";
import { PrismCarousel } from "motion-brew/prism-carousel";
import { ProjectIndex } from "motion-brew/project-index";
import { DuoFlip } from "motion-brew/duo-flip";
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
  { id: "duo", name: "Duo flip", render: ({ items }) => <div className="mx-auto max-w-3xl py-6"><DuoFlip images={items} /></div> },
  { id: "ribbon", name: "Ribbon", render: ({ items, dark }) => <RibbonGallery items={items} label="Photo ribbon" dimColor={dark ? "rgb(14 15 26)" : "rgb(243 244 247)"} /> },
  { id: "tilt", name: "Tilt", render: ({ items }) => <div className="py-10"><TiltCarousel items={items} cardWidth={300} cardHeight={200} label="Photo carousel" /></div> },
  { id: "infinite", name: "Infinite", render: ({ items }) => <InfiniteGallery items={items} className="h-[78vh] min-h-[420px] overflow-hidden rounded-3xl" /> },
  { id: "depth", name: "Depth", render: ({ items }) => <DepthCarousel items={items} className="h-[78vh] min-h-[420px]" /> },
  { id: "prism", name: "Prism", render: ({ items }) => <PrismCarousel cards={items.map((i) => ({ label: i.title, image: i.src, caption: i.meta }))} /> },
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
    <main className="mx-auto max-w-6xl px-5 pb-16 pt-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{site.name}</h1>
          <p className="mt-1 text-zinc-500">{site.tagline}</p>
          <p className="text-sm text-zinc-400">{site.place}</p>
        </div>
        <div className="flex items-center gap-3">
        <nav aria-label="Gallery style" className="flex max-w-full flex-wrap gap-1 rounded-3xl bg-ink/[0.07] p-1">
          {STYLES.map((s) => (
            <button key={s.id} onClick={() => setStyle(s.id)} className="relative rounded-full px-4 py-1.5 text-sm font-medium">
              {cur.id === s.id && <motion.span layoutId="pill" className="absolute inset-0 rounded-full bg-surface shadow-md" transition={{ type: "spring", stiffness: 500, damping: 34 }} />}
              <span className="relative">{s.name}</span>
            </button>
          ))}
        </nav>
        <ThemeToggle />
        </div>
      </header>

      {images.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-400/50 p-10 text-center text-zinc-500">No images yet. Put your photos in <code>src/gallery/</code>.</p>
      ) : (
        <motion.div key={cur.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {cur.render({ items: images, onOpen: setOpen, dark })}
        </motion.div>
      )}
      {cur.lightbox && <Lightbox items={images} index={open} onClose={close} onChange={setOpen} />}

      <footer className="mt-16 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800">
        <p className="max-w-2xl">{site.bio}</p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <a className="underline-offset-4 hover:underline" href={`mailto:${site.email}`}>{site.email}</a>
          {site.social.map((s) => <a key={s.name} className="underline-offset-4 hover:underline" href={s.href} target="_blank" rel="noreferrer">{s.name}</a>)}
        </p>
      </footer>
    </main>
  );
}
