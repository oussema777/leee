import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SOURCE = 'C:\\Users\\Marketing Manager\\Downloads\\leee-photos\\All images';
const DEST = 'C:\\Users\\Marketing Manager\\Desktop\\Agent X\\Leee Expirence\\leee-experience\\public\\images\\projects';

// Map folder names → slug prefix for output filenames
const folderSlugMap = {
  'berytech': 'berytech',
  'CAWTAR 2022-2023': 'cawtar',
  'GTS seketak': 'gits',
  'IFC 2024': 'kims-ifc',
  'ILO': 'ilo',
  'JCI 2022': 'jci',
  'nawara program - IRC 2025': 'nawara-irc',
  'prospects 2021': 'prospects',
  'PSDP 2022-2023': 'psdp',
  'relief': 'relief',
  'salama 2020': 'salama',
  'UNFIL': 'unifil',
};

const MAX_PER_PROGRAM = 10;
const WIDTH = 1200;
const HEIGHT = 800;
const QUALITY = 82;

function walkDir(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (/\.(jpe?g|png|webp)$/i.test(entry)) {
      results.push({ name: entry, path: fullPath, size: stat.size });
    }
  }
  return results;
}

async function main() {
  // Ensure dest exists
  if (!fs.existsSync(DEST)) fs.mkdirSync(DEST, { recursive: true });

  // Clear existing optimized images
  const existing = fs.readdirSync(DEST).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  console.log(`Clearing ${existing.length} existing images from ${DEST}...`);
  for (const f of existing) {
    fs.unlinkSync(path.join(DEST, f));
  }

  const folders = fs.readdirSync(SOURCE).filter(f => fs.statSync(path.join(SOURCE, f)).isDirectory());

  let totalProcessed = 0;
  const manifest = {}; // slug -> [image paths]

  for (const folder of folders) {
    const slug = folderSlugMap[folder];
    if (!slug) {
      console.log(`⚠️  No slug mapping for folder: "${folder}" — skipping`);
      continue;
    }

    const images = walkDir(path.join(SOURCE, folder));

    // Filter out screenshots (usually lower quality / not real photos)
    const realPhotos = images.filter(img => !img.name.toLowerCase().includes('screenshot'));

    // Sort by file size descending (larger = higher quality/resolution)
    realPhotos.sort((a, b) => b.size - a.size);

    // Take top N
    const selected = realPhotos.slice(0, MAX_PER_PROGRAM);

    console.log(`\n📁 ${folder} → ${slug} (${selected.length}/${images.length} selected)`);

    manifest[slug] = [];

    for (let i = 0; i < selected.length; i++) {
      const src = selected[i];
      const outName = `${slug}-${i + 1}.jpg`;
      const outPath = path.join(DEST, outName);

      try {
        await sharp(src.path)
          .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' })
          .jpeg({ quality: QUALITY, progressive: true })
          .toFile(outPath);

        const outSize = fs.statSync(outPath).size;
        console.log(`  ✅ ${outName} (${(src.size/1024).toFixed(0)}KB → ${(outSize/1024).toFixed(0)}KB)`);
        manifest[slug].push(`/images/projects/${outName}`);
        totalProcessed++;
      } catch (err) {
        console.log(`  ❌ Failed: ${src.name} — ${err.message}`);
      }
    }
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`Total images processed: ${totalProcessed}`);
  console.log(`Programs: ${Object.keys(manifest).length}`);
  console.log(`════════════════════════════════════════\n`);

  // Output manifest for use in seed script
  console.log('// Image manifest for seed script:');
  console.log('const imageManifest = ' + JSON.stringify(manifest, null, 2) + ';');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
