import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

// ── Spreadsheet programs (from Jana's Excel) ──
// Each row from the spreadsheet mapped to what we matched in DB
const spreadsheetPrograms = [
  { folder: 'CAWTAR 2022-2023', year: '2022', country: 'Multi-country', pillar: 'LEE Academy', donor: 'CAWTAR & Kvinna till Kvinna', target: '20 Partners across 6 countries', dbSlug: 'empowering-women-entrepreneurs-mena', photos: 10 },
  { folder: 'GTS seketak', year: '2025', country: 'Multi-country', pillar: 'LEE Academy', donor: 'GTS Seketak, AfriLabs, Falak, SUNI', target: 'Global Investment & Trade Summit', dbSlug: 'gits-global-investment-trade-summit-2025', photos: 10 },
  { folder: 'IFC 2024', year: '2024-2025', country: 'Somalia', pillar: 'LEE Academy', donor: 'KIMS, IFC, World Bank', target: '20 Senior Management trained', dbSlug: 'kims-ifc-senior-management-somalia', photos: 10 },
  { folder: 'ILO', year: '2024', country: 'Lebanon', pillar: 'LEE Academy/Incubator', donor: 'EU & ILO', target: '300 Feasibility Studies, 1000 Trained', dbSlug: 'enable-siyb-training-2024', photos: 7 },
  { folder: 'JCI 2022', year: '2022', country: 'Lebanon', pillar: 'LEE Academy', donor: 'JCI Lebanon', target: 'Partnership cooperation', dbSlug: null, photos: 0, note: 'Only had 1 screenshot, no real photos' },
  { folder: 'PSDP 2022-2023', year: '2022-2023', country: 'Lebanon', pillar: 'LEE Incubators', donor: 'PSDP / Canada Embassy & ILO', target: 'Women skills development', dbSlug: 'psdp-gender-sensitive-business-support', photos: 10 },
  { folder: 'UNFIL', year: '2021-2022', country: 'South Lebanon', pillar: 'LEE Incubators', donor: 'UNIFIL', target: '25 green fashion, 25 VT, 25 feasibility studies', dbSlug: 'unifil-women-social-enterprises', photos: 4 },
  { folder: 'berytech', year: '2023', country: 'Lebanon', pillar: 'LEE Incubators', donor: 'Berytech & EU', target: '16 Researchers & Startups incubated', dbSlug: 'berytech-eu-startup-incubation-2023', photos: 7 },
  { folder: 'nawara program - IRC 2025', year: '2025', country: 'Lebanon', pillar: 'LEE Incubators', donor: 'IRC', target: 'Women economic empowerment', dbSlug: 'srp2-economic-empowerment-sgbv', photos: 10 },
  { folder: 'prospects 2021', year: '2020-2022', country: 'Lebanon', pillar: 'LEE Incubators', donor: 'Netherlands Embassy, ILO, World Bank', target: '2000 startups, 150 feasibility, 59 incubated', dbSlug: 'prospects-entrepreneurship-agriculture', photos: 10 },
  { folder: 'relief', year: '2023', country: 'Lebanon', pillar: 'LEE Academy', donor: 'Relief International / WFP', target: '25 Staff partners trained', dbSlug: 'livelihoods-resilience-lebanese-syrians', photos: 3 },
  { folder: 'salama 2020', year: '2020', country: 'Lebanon', pillar: 'LEE Humanitarian', donor: 'IPPF, Salama, SICD', target: '2500 PSS Sessions', dbSlug: 'salama-pss-humanitarian-2020', photos: 10 },
];

// Spreadsheet rows that had NO photo folders
const spreadsheetNoPhotos = [
  { year: '2020', country: 'Iraq', pillar: 'LEE Academy + Business Clinic + Media Hub', donor: 'World Bank Group', target: '45 Staff trained, 80 coaching sessions', note: 'No photos provided' },
  { year: '2020-2023', country: 'Yemen', pillar: 'LEE Academy', donor: 'Yemen Microfinance Network & SDF', target: '25 Microfinance Members per cohort', note: 'No photos provided' },
  { year: '2021', country: 'Lebanon', pillar: 'LEE Academy', donor: 'Action Against Hunger', target: 'Cumulative training', note: 'No photos provided' },
  { year: '2023', country: 'Lebanon', pillar: 'LEE Incubators', donor: 'Utopia / Oxfam / DANIDA', target: 'Feasibility studies, pitching & granting', note: 'No photos provided' },
  { year: '2024', country: 'Lebanon', pillar: 'LEE Academy', donor: 'Solidarités International (SI)', target: 'Training', note: 'No photos provided' },
  { year: '2024-2025', country: 'Lebanon', pillar: 'LEE Accelerator', donor: 'RMF & Welthungerhilfe / BMZ', target: '45 feasibility, 45 pitching, 24 grants', note: 'No photos provided' },
  { year: '2025', country: 'Lebanon', pillar: 'LEE Humanitarian', donor: 'Norway Embassy & UNDP', target: '20000 hot meals, 800 food parcels', note: 'No photos provided' },
  { year: '2024-2025', country: 'Lebanon', pillar: 'LEE Humanitarian', donor: 'GIZ & International Alert', target: '24000 hot meals', note: 'No photos provided' },
  { year: '2026', country: 'Lebanon', pillar: 'LEE Academy + Clinic + Media Hub', donor: 'SI & GIZ', target: '10 TOT, 20 Farmers, 10 coaching', note: 'No photos provided' },
  { year: '2023', country: 'Lebanon', pillar: 'LEE Business Clinic', donor: 'Lutheran World Relief / KIA', target: '1250 sessions for women MSME', note: 'No photos provided' },
  { year: '2026-2027', country: 'Lebanon', pillar: 'LEE Incubators', donor: 'Women Peace Fund & UNDP/SALAM', target: '70 feasibility, 70 trained', note: 'No photos provided' },
  { year: '2020-2021', country: 'Lebanon', pillar: 'LEE Media Hub', donor: 'LMFA & Palladium', target: 'E-learning materials', note: 'Only video file, no photos' },
  { year: '2022', country: 'Lebanon', pillar: 'LEE Media Hub', donor: 'CCIAS / Rest@art / EU', target: 'Branding for 20 MSME', note: 'No photos provided' },
  { year: '2023', country: 'Lebanon', pillar: 'LEE Media Hub', donor: 'CAWTAR / Kvinna till Kvinna', target: 'E-learning curricula, social media', note: 'No photos provided' },
];

async function main() {
  const programs = await prisma.program.findMany({
    include: {
      pillar: { select: { titleEn: true } },
      images: { select: { imageUrl: true } },
    },
  });

  const dbMap = {};
  for (const p of programs) {
    dbMap[p.slug] = p;
  }

  // ── SHEET 1: Photo Integration Status ──
  const sheet1Rows = spreadsheetPrograms.map(sp => {
    const dbProg = sp.dbSlug ? dbMap[sp.dbSlug] : null;
    const realPhotos = dbProg ? dbProg.images.filter(i => i.imageUrl.includes('/images/projects/')).length : 0;
    const coverIsReal = dbProg?.coverImageUrl?.includes('/images/projects/');

    let status;
    if (!sp.dbSlug) {
      status = 'NOT IN DB (no photos)';
    } else if (!dbProg) {
      status = 'DB SLUG NOT FOUND';
    } else if (realPhotos > 0) {
      status = 'DONE';
    } else {
      status = 'PENDING';
    }

    return {
      'Photo Folder': sp.folder,
      'Year': sp.year,
      'Country': sp.country,
      'Pillar': sp.pillar,
      'Donor (Spreadsheet)': sp.donor,
      'Target': sp.target,
      'DB Program Slug': sp.dbSlug || 'N/A',
      'DB Program Title': dbProg?.titleEn || 'N/A',
      'DB Donor': dbProg?.donorEn || 'N/A',
      'Photos Integrated': realPhotos,
      'Cover Status': dbProg ? (coverIsReal ? 'Real Photo' : 'Placeholder') : 'N/A',
      'STATUS': status,
      'Notes': sp.note || '',
    };
  });

  // ── SHEET 2: Spreadsheet Rows Without Photos ──
  const sheet2Rows = spreadsheetNoPhotos.map(sp => ({
    'Year': sp.year,
    'Country': sp.country,
    'Pillar': sp.pillar,
    'Donor': sp.donor,
    'Target': sp.target,
    'Note': sp.note,
  }));

  // ── SHEET 3: All DB Programs ──
  const sheet3Rows = programs
    .sort((a, b) => (a.pillar?.titleEn || '').localeCompare(b.pillar?.titleEn || ''))
    .map(p => {
      const realPhotos = p.images.filter(i => i.imageUrl.includes('/images/projects/')).length;
      const coverIsReal = p.coverImageUrl?.includes('/images/projects/');

      // Check if this program matches any spreadsheet entry
      const matched = spreadsheetPrograms.find(sp => sp.dbSlug === p.slug);

      return {
        'Slug': p.slug,
        'Title': p.titleEn,
        'Year': p.year || '',
        'Status': p.status,
        'Pillar': p.pillar?.titleEn || '',
        'Location': p.locationEn || '',
        'Donor': p.donorEn || '',
        'Cover': p.coverImageUrl || '',
        'Cover Type': coverIsReal ? 'Real' : 'Placeholder',
        'Gallery Photos': realPhotos,
        'From Spreadsheet?': matched ? 'Yes' : 'No',
        'Spreadsheet Folder': matched?.folder || '',
        'IMAGE STATUS': realPhotos > 0 ? `DONE (${realPhotos} photos)` : 'NO PHOTOS',
      };
    });

  // Build workbook
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(sheet1Rows);
  ws1['!cols'] = [
    { wch: 28 }, { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 35 },
    { wch: 40 }, { wch: 45 }, { wch: 50 }, { wch: 35 }, { wch: 15 },
    { wch: 14 }, { wch: 18 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Photo Integration');

  const ws2 = XLSX.utils.json_to_sheet(sheet2Rows);
  ws2['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 35 }, { wch: 35 }, { wch: 40 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'No Photos Available');

  const ws3 = XLSX.utils.json_to_sheet(sheet3Rows);
  ws3['!cols'] = [
    { wch: 45 }, { wch: 55 }, { wch: 8 }, { wch: 12 }, { wch: 25 },
    { wch: 30 }, { wch: 35 }, { wch: 40 }, { wch: 12 }, { wch: 14 },
    { wch: 16 }, { wch: 28 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'All DB Programs');

  const outPath = 'C:\\Users\\Marketing Manager\\Desktop\\programs-review.xlsx';
  XLSX.writeFile(wb, outPath);

  console.log(`\nExported to: ${outPath}`);
  console.log(`\nSheet 1 - Photo Integration: ${sheet1Rows.length} entries`);
  console.log(`Sheet 2 - No Photos Available: ${sheet2Rows.length} entries`);
  console.log(`Sheet 3 - All DB Programs: ${sheet3Rows.length} entries`);

  const done = sheet1Rows.filter(r => r.STATUS === 'DONE').length;
  const pending = sheet1Rows.filter(r => r.STATUS !== 'DONE').length;
  console.log(`\nDONE: ${done} | PENDING/OTHER: ${pending}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
