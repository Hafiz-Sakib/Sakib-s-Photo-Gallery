# Photo Gallery

Vite + React 18 + Tailwind 4 + Motion Brew (npm `motion-brew`, MIT). Only a gallery, with a style switcher.

    npm install
    npm run dev       # http://localhost:5173
    npm run build     # output in dist/

## Pictures: `src/gallery/`
Drop any image in (sub-folders fine). No code changes. jpg jpeg jpe jfif png apng gif webp avif svg bmp ico tif tiff
(+ heic/heif, Safari only), upper-case extensions too. Order = file name (`01-`, `02-` prefixes). The included
screenshots and portrait are from your portfolio; delete or replace them.

## Your info
`src/site.js`: name, tagline, bio, email, social links and optional captions per file name.

## Styles (switcher at the top, choice is remembered)
Grid, Showcase, Duo flip, Ribbon, Tilt, Infinite, Depth, Prism, Index.
To add or remove one, edit the `STYLES` list in `src/App.jsx`.

## Structure
    src/gallery/       your images (auto-loaded by src/gallery.js)
    src/site.js        your info + captions
    src/App.jsx        style switcher + STYLES list
    src/components/    Grid, Showcase, Lightbox, RibbonGallery, tilt-carousel

## Theme and fonts
Day mode is the default; the sun/moon switch (top right) flips to night with a circular reveal and remembers the choice (`src/theme.js`).
Fonts: Bricolage Grotesque (headings) and Figtree (text), self-hosted via @fontsource-variable.
