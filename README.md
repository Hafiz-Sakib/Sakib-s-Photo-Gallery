# Photo Gallery

Vite + React 18 + Tailwind 3 + framer-motion. Only a gallery, with a style switcher.

## Run
    npm install
    npm run dev        # http://localhost:5173
    npm run build      # output in dist/

## Your pictures go here: `src/gallery/`
Drop any image in (sub-folders are fine), delete the `sample-*.jpg` files, done. No code changes.
jpg jpeg jpe jfif png apng gif webp avif svg bmp ico tif tiff (+ heic/heif, Safari only). Upper-case extensions work too.
Order follows file names (`01-`, `02-` prefixes); the caption is the file name.

## Your name
Edit `src/site.js`.

## Gallery styles (the switcher at the top, choice is remembered)
Grid, Showcase, Ribbon, Tilt are built in.
**Duo flip** (WebGL liquid fold): run this once in the project folder and it appears in the switcher by itself:

    curl -o src/components/duo-flip.tsx https://motion-brew.com/r/duo-flip.tsx

(Dependencies clsx, lucide-react, motion, tailwind-merge are already in package.json.)
Any other Motion Brew gallery: copy its file into `src/components/`, import it in `src/App.jsx` and add one entry to the `STYLES` array.

## Structure
    src/gallery/        <- your images
    src/gallery.js      <- auto-loads every image in that folder
    src/site.js         <- name + tagline
    src/App.jsx         <- style switcher + STYLES list
    src/components/     <- Grid, Showcase, Lightbox, RibbonGallery, tilt-carousel
# Sakib-s-Photo-Gallery
