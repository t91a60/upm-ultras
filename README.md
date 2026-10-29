# UPM Ultras

A single-page website for Ultras Polonia Międzyrzecze, a football supporters' group.
The site content is in Polish and includes group news, a photo gallery, sticker
shop information, joining instructions, an FAQ, and contact details.

[Visit the website](https://t91a60.github.io/upm-ultras/) ·
[Report an issue](https://github.com/t91a60/upm-ultras/issues)

## Features and stack

The site uses HTML, CSS, and JavaScript modules, built with Vite 8 and Tailwind CSS
v4. It includes a mobile navigation menu with keyboard controls, section tracking,
gallery lightboxes, image fallbacks, and external-link handling.

Vitest and JSDOM cover navigation and link behavior; ESLint checks JavaScript,
Prettier formats files, and Sharp generates WebP and AVIF images.

A web manifest and service worker are included, but offline availability depends
on successful service-worker installation and cached resources. It should not be
assumed to work on a first visit without a network connection.

## Run locally

Use **Node.js 22.13+ or Node.js 24+** with npm; the workflows use Node.js 22.
The locked Vite and JSDOM dependencies require recent Node.js patch releases.

```bash
git clone https://github.com/t91a60/upm-ultras.git
cd upm-ultras
npm ci
npm run dev
```

Open the URL printed by Vite, normally
`http://localhost:5173/upm-ultras/`. No backend, API keys, or environment variables
are required for the site.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run lint` | Check JavaScript with ESLint |
| `npm test` | Run the Vitest unit suite once |
| `npm run build` | Create the production site in `dist/` |
| `npm run preview` | Serve the production build locally after building |
| `npm run convert-images` | Generate WebP and AVIF files from images in `public/images/` |
| `npm run optimize` | Convert images, then build |
| `npm run format` | Format project files with Prettier; this modifies files |

The image converter reads PNG, JPG, and JPEG files directly inside
`public/images/` and writes variants alongside them. It also generates 640, 1080,
and 1920-pixel versions when the source is wider than the target size. It does not
process subdirectories or update HTML image references for you.

## Project layout

```text
index.html          Site content and sections
style.css           Site styles
app.js              Module initialization
nav.js              Mobile navigation and section tracking
links.js            URL validation and external-link handling
ui.js               Reveal effects, gallery lightbox, image fallbacks
public/             Manifest, service worker, 404 page, SEO files, images
scripts/            Image conversion
__tests__/          Navigation and link tests
.github/workflows/  CI and GitHub Pages deployment
```

## Deployment and troubleshooting

Vite's base path is `/upm-ultras/`. Both workflows run on pushes to `main` and
`master`; CI also runs for pull requests targeting those branches. The deployment
workflow checks lint and tests, builds the site, and publishes `dist/` to
[GitHub Pages](https://t91a60.github.io/upm-ultras/).

When hosting at another path, review `vite.config.js`, the worker registration in
`sw-register.js`, and the URLs in `public/sw.js` and `public/manifest.json`.
Changing Vite's base alone does not update those hardcoded paths.

If an old version persists, inspect or unregister the service worker and clear
its caches in the browser's developer tools. Its cache names are fixed. The
worker also precaches `/upm-ultras/style.css`, while Vite emits a hashed CSS asset
in production; check the worker's installation status before relying on offline
behavior.

For image-conversion errors, check that input files are supported images in
`public/images/`. An empty input directory is allowed and produces no images.

## Contributing

Keep site content changes in `index.html`, styles in `style.css`, and interactive
behavior in the relevant JavaScript module. Run lint, tests, and a production
build before submitting a pull request. Check navigation and gallery behavior in
a browser when editing those features.

## License

`package.json` declares ISC, but this repository has no standalone `LICENSE`
file. Confirm permission before reusing code, text, or images.
