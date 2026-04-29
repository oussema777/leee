import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

// Photo folder → DB program mapping (from Jana's spreadsheet)
const photoMappings = [
  { folder: 'CAWTAR 2022-2023', donor: 'CAWTAR & Kvinna till Kvinna', target: '20 Partners across 6 countries', dbSlug: 'empowering-women-entrepreneurs-mena', matchNote: 'CORRECT — same donor & pillar' },
  { folder: 'GTS seketak', donor: 'GTS Seketak, AfriLabs, Falak, SUNI', target: 'Global Investment & Trade Summit', dbSlug: 'gits-global-investment-trade-summit-2025', matchNote: 'NEW PROGRAM CREATED from spreadsheet' },
  { folder: 'IFC 2024', donor: 'KIMS, IFC, World Bank', target: '20 Senior Management trained', dbSlug: 'kims-ifc-senior-management-somalia', matchNote: 'NEW PROGRAM CREATED from spreadsheet' },
  { folder: 'ILO', donor: 'EU & ILO', target: '300 Feasibility, 1000 Trained, 600 coaching', dbSlug: 'enable-siyb-training-2024', matchNote: 'REVIEW — matched by donor (EU & ILO)' },
  { folder: 'JCI 2022', donor: 'JCI Lebanon', target: 'Partnership cooperation', dbSlug: null, matchNote: 'SKIPPED — only 1 screenshot, no real photos' },
  { folder: 'PSDP 2022-2023', donor: 'PSDP / Canada & ILO', target: 'Women skills development', dbSlug: 'psdp-gender-sensitive-business-support', matchNote: 'CORRECT — PSDP program matches' },
  { folder: 'UNFIL', donor: 'UNIFIL', target: '25 green fashion, feasibility, grants', dbSlug: 'unifil-women-social-enterprises', matchNote: 'REVIEW — 3 UNIFIL programs in DB, assigned to women-led social enterprises (2021)' },
  { folder: 'berytech', donor: 'Berytech & EU', target: '16 Researchers & Startups incubated', dbSlug: 'berytech-eu-startup-incubation-2023', matchNote: 'NEW PROGRAM CREATED from spreadsheet' },
  { folder: 'nawara program - IRC 2025', donor: 'IRC', target: 'Women economic empowerment', dbSlug: 'srp2-economic-empowerment-sgbv', matchNote: 'REVIEW — mapped to SRP2/IRC program' },
  { folder: 'prospects 2021', donor: 'Netherlands Embassy, ILO, World Bank', target: '2000 startups, 150 feasibility, 59 incubated', dbSlug: 'prospects-entrepreneurship-agriculture', matchNote: 'CORRECT — Prospects program matches' },
  { folder: 'relief', donor: 'Relief International / WFP', target: '25 Staff partners trained', dbSlug: 'livelihoods-resilience-lebanese-syrians', matchNote: 'CORRECT — same donor (WFP & Relief International)' },
  { folder: 'salama 2020', donor: 'IPPF, Salama, SICD', target: '2500 PSS Sessions', dbSlug: 'salama-pss-humanitarian-2020', matchNote: 'NEW PROGRAM CREATED from spreadsheet' },
];

async function main() {
  const programs = await prisma.program.findMany({
    include: {
      pillar: { select: { titleEn: true } },
      images: { select: { imageUrl: true }, orderBy: { order: 'asc' } },
    },
    orderBy: [{ pillar: { titleEn: 'asc' } }, { year: 'desc' }],
  });

  const dbMap = {};
  for (const p of programs) dbMap[p.slug] = p;

  const wb = XLSX.utils.book_new();

  // ── SHEET 1: Photo Integration Status (live from DB) ──
  const sheet1 = photoMappings.map(m => {
    const db = m.dbSlug ? dbMap[m.dbSlug] : null;
    const realPhotos = db ? db.images.filter(i => i.imageUrl.includes('/images/projects/')).length : 0;
    const coverIsReal = db?.coverImageUrl?.includes('/images/projects/');

    return {
      'Photo Folder': m.folder,
      'Spreadsheet Donor': m.donor,
      'Spreadsheet Target': m.target,
      'DB Slug': m.dbSlug || 'N/A',
      'DB Title': db?.titleEn || 'N/A',
      'DB Donor': db?.donorEn || 'N/A',
      'Real Photos': realPhotos,
      'Cover': coverIsReal ? 'Real Photo' : (db ? 'Placeholder' : 'N/A'),
      'STATUS': !m.dbSlug ? 'SKIPPED' : (realPhotos > 0 ? 'DONE' : 'PENDING'),
      'Match Quality': m.matchNote,
    };
  });

  const ws1 = XLSX.utils.json_to_sheet(sheet1);
  ws1['!cols'] = [
    { wch: 28 }, { wch: 38 }, { wch: 45 }, { wch: 48 }, { wch: 55 },
    { wch: 38 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 55 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Photo Mapping');

  // ── SHEET 2: All 24 DB Programs (live) ──
  const sheet2 = programs.map(p => {
    const realPhotos = p.images.filter(i => i.imageUrl.includes('/images/projects/')).length;
    const coverIsReal = p.coverImageUrl?.includes('/images/projects/');
    const matched = photoMappings.find(m => m.dbSlug === p.slug);

    return {
      'Slug': p.slug,
      'Title': p.titleEn,
      'Year': p.year || '',
      'Status': p.status,
      'Pillar': p.pillar?.titleEn || '',
      'Location': p.locationEn || '',
      'Donor': p.donorEn || '',
      'Cover Type': coverIsReal ? 'Real Photo' : 'Placeholder',
      'Gallery Photos': realPhotos,
      'IMAGE STATUS': realPhotos > 0 ? `DONE (${realPhotos})` : 'NO PHOTOS',
      'Photo Folder': matched?.folder || '',
    };
  });

  const ws2 = XLSX.utils.json_to_sheet(sheet2);
  ws2['!cols'] = [
    { wch: 48 }, { wch: 55 }, { wch: 6 }, { wch: 12 }, { wch: 22 },
    { wch: 30 }, { wch: 38 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'All Programs');

  // ── SHEET 3: Summary ──
  const withPhotos = programs.filter(p => p.images.some(i => i.imageUrl.includes('/images/projects/')));
  const withRealCover = programs.filter(p => p.coverImageUrl?.includes('/images/projects/'));
  const totalRealPhotos = programs.reduce((sum, p) => sum + p.images.filter(i => i.imageUrl.includes('/images/projects/')).length, 0);

  const summary = [
    { 'Metric': 'Total Programs in DB', 'Value': programs.length },
    { 'Metric': 'Programs with REAL Photos', 'Value': withPhotos.length },
    { 'Metric': 'Programs with REAL Cover Image', 'Value': withRealCover.length },
    { 'Metric': 'Programs with NO Photos', 'Value': programs.length - withPhotos.length },
    { 'Metric': 'Total Real Photos in DB', 'Value': totalRealPhotos },
    { 'Metric': '', 'Value': '' },
    { 'Metric': 'Photo Folders from Downloads', 'Value': 12 },
    { 'Metric': 'Successfully Integrated', 'Value': photoMappings.filter(m => m.dbSlug && dbMap[m.dbSlug]?.images.some(i => i.imageUrl.includes('/images/projects/'))).length },
    { 'Metric': 'Skipped (no photos)', 'Value': photoMappings.filter(m => !m.dbSlug).length },
    { 'Metric': 'Mappings needing REVIEW', 'Value': photoMappings.filter(m => m.matchNote.startsWith('REVIEW')).length },
  ];

  const ws3 = XLSX.utils.json_to_sheet(summary);
  ws3['!cols'] = [{ wch: 40 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Summary');

  const outPath = 'C:\\Users\\Marketing Manager\\Desktop\\programs-review-updated.xlsx';
  XLSX.writeFile(wb, outPath);

  console.log(`\nExported to: ${outPath}`);
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total Programs: ${programs.length}`);
  console.log(`With Real Photos: ${withPhotos.length}`);
  console.log(`With Real Cover: ${withRealCover.length}`);
  console.log(`No Photos: ${programs.length - withPhotos.length}`);
  console.log(`Total Real Photos: ${totalRealPhotos}`);
  console.log(`Mappings needing review: ${photoMappings.filter(m => m.matchNote.startsWith('REVIEW')).length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
