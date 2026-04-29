import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const programs = await prisma.program.findMany({
    include: { images: { select: { imageUrl: true }, orderBy: { order: 'asc' } } },
  });

  let updated = 0;

  for (const p of programs) {
    const realPhotos = p.images.filter(i => i.imageUrl.includes('/images/projects/'));
    const coverIsReal = p.coverImageUrl?.includes('/images/projects/');

    if (realPhotos.length > 0 && !coverIsReal) {
      const newCover = realPhotos[0].imageUrl;
      await prisma.program.update({
        where: { id: p.id },
        data: { coverImageUrl: newCover },
      });
      console.log(`Updated cover: ${p.slug}`);
      console.log(`  Old: ${p.coverImageUrl}`);
      console.log(`  New: ${newCover}\n`);
      updated++;
    }
  }

  console.log(`\nDone. Updated ${updated} cover images.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
