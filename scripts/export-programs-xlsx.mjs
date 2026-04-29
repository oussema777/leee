import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

async function main() {
  const programs = await prisma.program.findMany({
    include: {
      pillar: { select: { titleEn: true } },
      images: { select: { imageUrl: true }, orderBy: { order: 'asc' } },
    },
    orderBy: [{ pillar: { titleEn: 'asc' } }, { year: 'desc' }, { titleEn: 'asc' }],
  });

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
      ? (p.coverImageUrl.includes('/images/projects/') ? 'Real Photo' : 'Placeholder')
      : 'None';

    return {
      'Program Slug': p.slug,
      'Title': p.titleEn,
      'Year': p.year || '',
      'Status': p.status,
      'Pillar': p.pillar?.titleEn || '',
      'Location': p.locationEn || '',
      'Donor': p.donorEn || '',
      'Cover Image Status': coverStatus,
      'Gallery Photos': realImages.length,
      'IMAGE STATUS': imageStatus,
      'Photo Paths': realImages.map(i => i.imageUrl).join(', '),
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 40 }, // slug
    { wch: 55 }, // title
    { wch: 8 },  // year
    { wch: 12 }, // status
    { wch: 25 }, // pillar
    { wch: 30 }, // location
    { wch: 35 }, // donor
    { wch: 15 }, // cover status
    { wch: 15 }, // gallery photos
    { wch: 20 }, // image status
    { wch: 80 }, // paths
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Programs');

  const outPath = 'C:\\Users\\Marketing Manager\\Desktop\\programs-status.xlsx';
  XLSX.writeFile(wb, outPath);

  console.log(`Exported ${programs.length} programs to: ${outPath}`);

  const withReal = programs.filter(p => p.images.some(i => i.imageUrl.includes('/images/projects/')));
  const noImages = programs.filter(p => p.images.length === 0);
  console.log(`\nWith real photos: ${withReal.length}`);
  console.log(`No images: ${noImages.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
