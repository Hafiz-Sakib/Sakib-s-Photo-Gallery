import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { images } from "./gallery";
import { site } from "./site";
import { Grid } from "./components/Grid";
import { Showcase } from "./components/Showcase";
import { Lightbox } from "./components/Lightbox";
import { RibbonGallery } from "./components/RibbonGallery";
import { TiltCarousel } from "./components/tilt-carousel";

// Optional: if you add src/components/duo-flip.tsx (command in README), a "Duo flip" style appears by itself.
const duo = import.meta.glob("./components/duo-flip.{tsx,jsx}");
const loadDuo = Object.values(duo)[0];
const DuoFlip = loadDuo ? lazy(() => loadDuo().then((m) => ({ default: m.DuoFlip }))) : null;

const STYLES = [
  { id: "grid", name: "Grid", lightbox: true, render: (p) => <Grid {...p} /> },
  { id: "showcase", name: "Showcase", lightbox: true, render: (p) => <Showcase {...p} /> },
  { id: "ribbon", name: "Ribbon", render: ({ items }) => <RibbonGallery items={items} label="Photo ribbon" /> },
  { id: "tilt", name: "Tilt", render: ({ items }) => <div className="py-10"><TiltCarousel items={items} cardWidth={300} cardHeight={200} label="Photo carousel" /></div> },
  ...(DuoFlip ? [{ id: "duo", name: "Duo flip", render: ({ items }) => <div className="mx-auto max-w-3xl py-6"><Suspense fallback={null}><DuoFlip images={items} /></Suspense></div> }] : []),
];

export default function App() {
  const [style, setStyle] = useState(() => { try { return localStorage.getItem("gallery-style"); } catch { return null; } });
  const [open, setOpen] = useState(null);
  const cur = STYLES.find((s) => s.id === style) || STYLES[0];
  useEffect(() => { try { localStorage.setItem("gallery-style", cur.id); } catch {} }, [cur.id]);
  const close = useCallback(() => setOpen(null), []);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{site.name}</h1>
          <p className="mt-1 text-zinc-500">{site.tagline}</p>
        </div>
        <nav aria-label="Gallery style" className="flex flex-wrap gap-1 rounded-full bg-zinc-200/70 p-1 dark:bg-zinc-800/70">
          {STYLES.map((s) => (
            <button key={s.id} onClick={() => setStyle(s.id)} className="relative rounded-full px-4 py-1.5 text-sm font-medium">
              {cur.id === s.id && <motion.span layoutId="pill" className="absolute inset-0 rounded-full bg-white shadow dark:bg-zinc-600" transition={{ type: "spring", stiffness: 500, damping: 34 }} />}
              <span className="relative">{s.name}</span>
            </button>
          ))}
        </nav>
      </header>

      {images.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-400/50 p-10 text-center text-zinc-500">
          No images yet. Put your photos in <code>src/gallery/</code>.
        </p>
      ) : (
        <motion.div key={cur.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {cur.render({ items: images, onOpen: setOpen })}
        </motion.div>
      )}
      {cur.lightbox && <Lightbox items={images} index={open} onClose={close} onChange={setOpen} />}
    </main>
  );
}
