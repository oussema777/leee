import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const programs = await prisma.program.findMany({
    include: {
      pillar: { select: { titleEn: true } },
      images: { select: { imageUrl: true } },
    },
    orderBy: { titleEn: 'asc' },
  });

  console.log(`Total programs in DB: ${programs.length}\n`);
  console.log('SLUG | TITLE | YEAR | STATUS | PILLAR | DONOR | COVER_TYPE | REAL_PHOTOS | TOTAL_IMAGES');
  console.log('-'.repeat(180));

  let withPhotos = 0;
  let withPlaceholder = 0;

  for (const p of programs) {
    const real = p.images.filter(i => i.imageUrl.includes('/images/projects/')).length;
    const coverType = p.coverImageUrl?.includes('/images/projects/') ? 'REAL' : 'PLACEHOLDER';
    if (real > 0) withPhotos++;
    else withPlaceholder++;

    console.log(`${p.slug} | ${p.titleEn} | ${p.year || ''} | ${p.status} | ${p.pillar?.titleEn || ''} | ${p.donorEn || ''} | ${coverType} | ${real} | ${p.images.length}`);
  }

  console.log(`\n--- SUMMARY ---`);
  console.log(`Programs with REAL photos: ${withPhotos}`);
  console.log(`Programs with NO real photos: ${withPlaceholder}`);

  // List programs that have real photos but placeholder covers
  console.log(`\n--- PROGRAMS WITH REAL PHOTOS BUT PLACEHOLDER COVER ---`);
  for (const p of programs) {
    const real = p.images.filter(i => i.imageUrl.includes('/images/projects/')).length;
    const coverIsReal = p.coverImageUrl?.includes('/images/projects/');
    if (real > 0 && !coverIsReal) {
      console.log(`  ${p.slug} — cover: ${p.coverImageUrl} — has ${real} real photos`);
    }
  }
}

main().catch(e => {
  console.error('DB ERROR:', e.message);
  process.exit(1);
}).finally(() => prisma.$disconnect());
