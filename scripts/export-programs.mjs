import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const programs = await prisma.program.findMany({
    include: {
      pillar: { select: { titleEn: true } },
      images: { select: { imageUrl: true }, orderBy: { order: 'asc' } },
    },
    orderBy: [{ year: 'desc' }, { titleEn: 'asc' }],
  });

  // Build CSV
  const header = [
    'Slug', 'Title (EN)', 'Year', 'Status', 'Pillar', 'Location', 'Donor',
    'Cover Image', 'Cover Status', 'Total Gallery Images', 'Real Photos Count',
    'Real Photo Paths', 'IMAGE STATUS'
  ].join('\t');

  const rows = programs.map(p => {
    const realImages = p.images.filter(i => i.imageUrl.includes('/images/projects/'));

    let imageStatus;
    if (realImages.length > 0) {
      imageStatus = `REAL PHOTOS (${realImages.length})`;
    } else if (p.images.length > 0) {
      imageStatus = `MOCK ONLY (${p.images.length})`;
    } else {
      imageStatus = 'NO IMAGES';
    }

    const coverStatus = p.coverImageUrl
      ? (p.coverImageUrl.includes('/images/projects/') ? 'Real' : 'Mock')
      : 'None';

    return [
      p.slug,
      p.titleEn,
      p.year || '',
      p.status,
      p.pillar?.titleEn || '',
      p.locationEn || '',
      p.donorEn || '',
      p.coverImageUrl || '',
      coverStatus,
      p.images.length,
      realImages.length,
      realImages.map(i => i.imageUrl).join('; '),
      imageStatus,
    ].join('\t');
  });

  const tsv = [header, ...rows].join('\n');

  // Save as TSV (opens in Excel)
  const outPath = 'C:\\Users\\Marketing Manager\\Desktop\\programs-status.tsv';
  fs.writeFileSync(outPath, '\uFEFF' + tsv, 'utf-8'); // BOM for Excel

  console.log(`\nExported ${programs.length} programs to: ${outPath}\n`);

  // Also print summary
  const withReal = programs.filter(p => p.images.some(i => i.imageUrl.includes('/images/projects/')));
  const noImages = programs.filter(p => p.images.length === 0);
  const mockOnly = programs.filter(p => p.images.length > 0 && !p.images.some(i => i.imageUrl.includes('/images/projects/')));

  console.log('=== SUMMARY ===');
  console.log(`Total programs:     ${programs.length}`);
  console.log(`With REAL photos:   ${withReal.length}`);
  console.log(`Mock images only:   ${mockOnly.length}`);
  console.log(`No images at all:   ${noImages.length}`);

  console.log('\n--- WITH REAL PHOTOS ---');
  withReal.forEach(p => {
    const count = p.images.filter(i => i.imageUrl.includes('/images/projects/')).length;
    console.log(`  ${p.slug} (${count} photos)`);
  });

  console.log('\n--- MOCK ONLY ---');
  mockOnly.forEach(p => console.log(`  ${p.slug}`));

  console.log('\n--- NO IMAGES ---');
  noImages.forEach(p => console.log(`  ${p.slug}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
