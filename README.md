# Photo Gallery

Vite + React 18 + Tailwind 4 + Motion Brew (npm `motion-brew`, MIT). Only a gallery, with a style switcher.

    npm install
    npm run dev       # http://localhost:5173
    npm run build     # output in dist/

## Pictures (up to ~500, no database, hosted on Vercel, images in GitHub)
1. Drop photos (any format, HEIC too) into `photos/`.
2. Run `npm run dev` (or `npm run build`). `scripts/prepare-gallery.mjs`:
   - converts HEIC, auto-rotates, strips GPS/EXIF, makes 3 WebP sizes in `public/gallery/{full,medium,thumb}/`
   - renames ALL photos (old + new) oldest -> newest by capture date: `1.webp, 2.webp, ...` (EXIF date, else file modified time)
   - moves your untouched originals to `originals/` (backup)
   - prints the total size (keep it under ~95 MB: Vercel Hobby lists a 100 MB static-upload limit)
3. `git add public/gallery src/gallery-meta.json scripts/gallery-state.json && git commit && git push`. Vercel builds from that.

`photos/` and `originals/` are git-ignored. Vercel/CI skips the prepare step (it deploys what you committed).
To change sizes/quality edit `TIERS` in `scripts/prepare-gallery.mjs`, then `npm run gallery:rebuild`.
Delete a photo by deleting its files (full/medium/thumb) or just `public/gallery/full/N.webp`; the next run renumbers.
Captions in `src/site.js` still match by the ORIGINAL file name.

## Your info
`src/site.js`: name, tagline, bio, email, social links and optional captions per file name.

## Styles (switcher at the top, choice is remembered)
Grid, Showcase, Duo flip, Ribbon, Tilt, Infinite, Depth, Prism, Index.
To add or remove one, edit the `STYLES` list in `src/App.jsx`.

## Structure
    public/gallery/    generated images (full / medium / thumb)
    src/gallery.js     builds the photo list from src/gallery-meta.json
    src/site.js        your info + captions
    src/App.jsx        style switcher + STYLES list
    src/components/    Grid, Showcase, Lightbox, RibbonGallery, tilt-carousel

## Theme and fonts
Day mode is the default; the sun/moon switch (top right) flips to night with a circular reveal and remembers the choice (`src/theme.js`).
Fonts: Bricolage Grotesque (headings) and Figtree (text), self-hosted via @fontsource-variable.
