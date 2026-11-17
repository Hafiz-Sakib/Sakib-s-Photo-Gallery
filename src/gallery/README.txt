Put your photos here (any sub-folder works).
Supported: jpg jpeg jpe jfif png apng gif webp avif svg bmp ico tif tiff. HEIC/HEIF are converted to JPG automatically.
Every time you run `npm run dev` (or `npm run build`) all images are renamed 1, 2, 3 ... from OLDEST to NEWEST capture date
(EXIF date; if a file has none, its modified time is used). New photos are merged in by date, so the numbering can shift.
Original names are remembered in src/gallery-names.json (this is what keeps your captions from src/site.js working).
