import sharp from 'sharp';
import { readdir, mkdir, stat } from 'fs/promises';
import { resolve, dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const INPUT_DIR = join(ROOT, 'public', 'images');
const WEBP_QUALITY = 85;
const AVIF_QUALITY = 70;
const SIZES = [640, 1080, 1920];

const SUPPORTED = new Set(['.png', '.jpg', '.jpeg']);

const generateWebP = async (filePath, outputPath) => {
  const ext = extname(filePath).toLowerCase();
  if (!SUPPORTED.has(ext)) return false;

  const input = sharp(filePath);
  const metadata = await input.metadata();

  for (const size of SIZES) {
    if (metadata.width <= size) continue;

    const sizedDir = join(outputPath, String(size));
    await mkdir(sizedDir, { recursive: true });

    const webpName = `${extname(filePath)}` === '.png' ? 'webp' : 'webp';
    // Actually generate proper filename
    const base = filePath.replace(/.*[\\/]/, '').replace(extname(filePath), '');

    await input
      .clone()
      .resize({ width: size, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(join(sizedDir, `${base}.webp`));

    await input
      .clone()
      .resize({ width: size, withoutEnlargement: true })
      .avif({ quality: AVIF_QUALITY })
      .toFile(join(sizedDir, `${base}.avif`));
  }

  // Always produce the default (largest) version
  await input
    .clone()
    .webp({ quality: WEBP_QUALITY })
    .toFile(join(outputPath, `${filePath.replace(/.*[\\/]/, '').replace(extname(filePath), '')}.webp`));

  await input
    .clone()
    .avif({ quality: AVIF_QUALITY })
    .toFile(join(outputPath, `${filePath.replace(/.*[\\/]/, '').replace(extname(filePath), '')}.avif`));

  return true;
};

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) continue;
    if (!SUPPORTED.has(extname(entry.name).toLowerCase())) continue;
    files.push(full);
  }

  return files;
};

try {
  const outputDir = join(INPUT_DIR);
  await mkdir(outputDir, { recursive: true });

  const files = await walk(INPUT_DIR);
  if (!files.length) {
    console.log('No supported images found in public/images/');
    console.log('Place .png, .jpg, or .jpeg files there and re-run.');
    process.exit(0);
  }

  console.log(`Found ${files.length} image(s). Converting to WebP + AVIF...`);

  let count = 0;
  for (const file of files) {
    const name = file.replace(/.*[\\/]/, '');
    console.log(`  [${++count}/${files.length}] ${name}...`);
    await generateWebP(file, outputDir);
  }

  console.log('Done! Images optimized in public/images/');
  console.log('WebP and AVIF versions generated alongside originals.');
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
