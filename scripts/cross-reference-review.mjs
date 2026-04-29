import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════
// Track Record 2026 — all 31 rows parsed from the spreadsheet
// ═══════════════════════════════════════════════════════════════════
const trackRecord = [
  { row: 1, year: '2020', country: 'Lebanon', pillar: 'LEE Humanitarian', name: 'Psycho-social support — Beirut Blast Emergency Appeal', donor: 'IPPF, Salama, SICD', dbSlug: 'salama-pss-humanitarian-2020', photoFolder: 'salama 2020' },
  { row: 2, year: '2020', country: 'Lebanon', pillar: 'LEE Academy', name: 'Technical Assistance for Ministry of Labour — gap assessment, capacity building, policies, micro credit', donor: 'World Bank Group & Ministry of Labor Affairs', dbSlug: null, photoFolder: null },
  { row: 3, year: '2020-2022', country: 'Lebanon', pillar: 'LEE Incubator', name: 'Promoting Entrepreneurship in Agriculture & Agro-food (Prospects Program)', donor: 'Netherlands Embassy, ILO, World Bank, UNICEF, IFC', dbSlug: 'prospects-entrepreneurship-agriculture', photoFolder: 'prospects 2021' },
  { row: 4, year: '2020-2021', country: 'Lebanon', pillar: 'LEE Digital Media Hub', name: 'E-learning Development for Microfinance Institutions', donor: 'LMFA / USAID', dbSlug: null, photoFolder: null },
  { row: 5, year: '2020-2021', country: 'Yemen', pillar: 'LEE Academy', name: 'Institutional Strengthening for Microfinance Institutions in Yemen', donor: 'Yemen Microfinance Network', dbSlug: null, photoFolder: null },
  { row: 6, year: '2021', country: 'Lebanon', pillar: 'LEE Incubator', name: 'Creating Job Opportunities Through Women-led Social Enterprises', donor: 'UNIFIL', dbSlug: 'unifil-women-social-enterprises', photoFolder: 'UNFIL' },
  { row: 7, year: '2021', country: 'Lebanon', pillar: 'LEE Academy', name: 'Capacity Building for Farmers & Cooperatives', donor: 'Action Against Hunger', dbSlug: 'capacity-building-farmers-cooperatives', photoFolder: null },
  { row: 8, year: '2022', country: 'Lebanon', pillar: 'LEE Incubator', name: 'Strengthening Business Performance of Cooperatives in the South', donor: 'UNIFIL', dbSlug: 'unifil-coop-south-strengthening', photoFolder: null },
  { row: 9, year: '2022', country: 'Lebanon (6 countries)', pillar: 'LEE Academy', name: 'Empowering Women Entrepreneurs in MENA Towards Equal Access to Markets', donor: 'CAWTAR / Kvinna till Kvinna', dbSlug: 'empowering-women-entrepreneurs-mena', photoFolder: 'CAWTAR 2022-2023' },
  { row: 10, year: '2022', country: 'Lebanon', pillar: 'LEE Incubator (Women in Blue economy)', name: 'Promoting Women in Aquaculture', donor: 'UNIFIL', dbSlug: 'unifil-women-aquaculture', photoFolder: null },
  { row: 11, year: '2022', country: 'Lebanon', pillar: 'LEE Digital Media Hub', name: 'Entrepreneurship Support — CCIAS Saida (Access to Market)', donor: 'CCIAS / Rest@art / EU', dbSlug: null, photoFolder: null },
  { row: 12, year: '2022-2023', country: 'Lebanon', pillar: 'LEE Incubator (Women in Green)', name: 'Gender-Sensitive Business Support for MSMEs & Entrepreneurs (PSDP)', donor: 'Canada Embassy & ILO & UNIDO, UNDP, UNWomen, FAO', dbSlug: 'psdp-gender-sensitive-business-support', photoFolder: 'PSDP 2022-2023' },
  { row: 13, year: '2023', country: 'Lebanon', pillar: 'LEE Business Clinic (Women Mentoring)', name: 'Financial Education Capacity Building for Women', donor: 'Lutheran World Relief – USAID', dbSlug: 'financial-education-women', photoFolder: null },
  { row: 14, year: '2023', country: 'Lebanon', pillar: 'LEE Academy', name: 'Business Development & Capacity Building for Youth — North Lebanon', donor: 'Utopia / Oxfam', dbSlug: 'business-development-youth-north', photoFolder: null },
  { row: 15, year: '2023', country: 'Multi-country (6)', pillar: 'LEE Digital Media Hub', name: 'Digital Learning for Women Sustainable Business', donor: 'CAWTAR – Kvinna till Kvinna', dbSlug: 'digital-learning-women-sustainable-business', photoFolder: null },
  { row: 16, year: '2023', country: 'Lebanon', pillar: 'LEE Academy', name: 'Livelihoods & Resilience Support to At-Risk Lebanese & Syrians', donor: 'WFP / Relief International', dbSlug: 'livelihoods-resilience-lebanese-syrians', photoFolder: 'relief' },
  { row: 17, year: '2023', country: 'MENA Region', pillar: 'LEE Digital Media Hub', name: "Digital Media Campaigns for Women's Empowerment", donor: 'CAWTAR / Kvinna till Kvinna', dbSlug: 'digital-media-campaigns-women-empowerment', photoFolder: null },
  { row: 18, year: '2023', country: 'Lebanon', pillar: 'LEE Incubator', name: "Houla Women's Green Fashion Factory", donor: 'UNIFIL', dbSlug: 'houla-women-green-fashion-factory', photoFolder: null },
  { row: 19, year: '2023', country: 'Lebanon', pillar: 'LEE Incubator', name: 'Startup & Research Incubation — Berytech & EU', donor: 'Berytech & EU', dbSlug: 'berytech-eu-startup-incubation-2023', photoFolder: 'berytech' },
  { row: 20, year: '2024', country: 'Lebanon', pillar: 'LEE Academy', name: 'ENABLE Programme — SIYB Entrepreneurship Training (EU funded)', donor: 'EU & ILO', dbSlug: 'enable-siyb-training-2024', photoFolder: 'ILO' },
  { row: 21, year: '2024-2025', country: 'Lebanon', pillar: 'LEE Humanitarian Aid', name: 'Community Kitchen Initiative — Building CSOs Capacity for Social Cohesion', donor: 'GIZ / International Alert', dbSlug: 'community-kitchens-social-cohesion', photoFolder: null },
  { row: 22, year: '2024', country: 'Somalia', pillar: 'LEE Academy', name: 'Training for Micro-finance Institution (IFC)', donor: 'IFC', dbSlug: 'kims-ifc-senior-management-somalia', photoFolder: 'IFC 2024' },
  { row: 23, year: '2024', country: 'Lebanon', pillar: 'LEE Academy', name: 'Optimizing Women Entrepreneurs & Rural Communities — Bekaa & Baalbeck-Hermel', donor: 'Solidarités International', dbSlug: 'optimizing-women-entrepreneurs-bekaa', photoFolder: null },
  { row: 24, year: '2024-2025', country: 'Lebanon', pillar: 'LEE Academy', name: 'Improving Social & Economic Resilience of Vulnerable Communities', donor: 'RMF & Welthungerhilfe / BMZ', dbSlug: 'social-economic-resilience-vulnerable-communities', photoFolder: null },
  { row: 25, year: '2025', country: 'Lebanon', pillar: 'LEE Humanitarian', name: 'Cash for Work for Food Relief in the North', donor: 'Norway Embassy & UNDP', dbSlug: 'cash-for-work-food-relief-north', photoFolder: null },
  { row: 26, year: '2025', country: 'Lebanon, Egypt, Tunisia', pillar: 'LEE Incubator (Investment readiness)', name: 'GITS Egypt: Global Investment & Trade Summit — Cairo Edition', donor: 'Seketak, JEUN\'ESS, Market Fund, EU, LEE, REDSTART, FALAK, AFRILABS', dbSlug: 'gits-global-investment-trade-summit-2025', photoFolder: 'GTS seketak' },
  { row: 27, year: '2025', country: 'Multi-country', pillar: 'LEE Incubator (Investment readiness)', name: 'GITS Abidjan: Global Investment & Trade Summit — Abidjan Edition', donor: 'Same consortium as GITS', dbSlug: 'gits-global-investment-trade-summit-2025', photoFolder: 'GTS seketak', note: 'Same DB program as GITS (combined)' },
  { row: 28, year: '2025', country: 'Multi-country', pillar: 'LEE Incubator (Investment readiness)', name: 'GITS Tunis: Global Investment & Trade Summit — Tunis Edition', donor: 'Same consortium as GITS', dbSlug: 'gits-global-investment-trade-summit-2025', photoFolder: 'GTS seketak', note: 'Same DB program as GITS (combined)' },
  { row: 29, year: '2025-2026', country: 'Lebanon', pillar: 'LEE Incubator (Women in business)', name: 'SRP2 — Economic Empowerment for Survivors of GBV', donor: 'IRC, World Bank, Netherlands Embassy, Kafa, Tabita', dbSlug: 'srp2-economic-empowerment-sgbv', photoFolder: 'nawara program - IRC 2025' },
  { row: 30, year: '2026', country: 'Lebanon', pillar: 'LEE Academy', name: 'Training & Coaching for Agricultural Cooperatives/Farmers', donor: 'Solidarités International', dbSlug: null, photoFolder: null, note: 'NEW — not yet in DB' },
  { row: 31, year: '2026-2027', country: 'Lebanon', pillar: 'LEE Incubator', name: 'Strengthening Inter-Community Dialogue & Women Empowerment', donor: 'Women Peace Fund & UNDP/SALAM/LADC/WWL', dbSlug: null, photoFolder: null, note: 'NEW — not yet in DB' },
];

async function main() {
  const programs = await prisma.program.findMany({
    include: {
      pillar: { select: { titleEn: true } },
      images: { select: { imageUrl: true }, orderBy: { order: 'asc' } },
    },
    orderBy: [{ year: 'desc' }, { titleEn: 'asc' }],
  });

  const dbMap = {};
  for (const p of programs) dbMap[p.slug] = p;

  const wb = XLSX.utils.book_new();

  // ════════════════════════════════════════
  // SHEET 1: Full Cross-Reference
  // ════════════════════════════════════════
  const sheet1 = trackRecord.map(tr => {
    const db = tr.dbSlug ? dbMap[tr.dbSlug] : null;
    const realPhotos = db ? db.images.filter(i => i.imageUrl.includes('/images/projects/')).length : 0;
    const coverIsReal = db?.coverImageUrl?.includes('/images/projects/');

    let status;
    if (!tr.dbSlug) {
      status = 'NOT IN DB';
    } else if (!db) {
      status = 'DB SLUG MISSING';
    } else if (realPhotos > 0) {
      status = 'COMPLETE';
    } else {
      status = 'IN DB — NO PHOTOS';
    }

    // Check pillar mismatch
    const dbPillar = db?.pillar?.titleEn || '';
    const trPillarClean = tr.pillar.replace(/ \(.*\)/, '').replace('LEE ', 'LEE ').trim();
    let pillarNote = '';
    if (db && dbPillar && !dbPillar.toLowerCase().includes(trPillarClean.replace('LEE ', '').toLowerCase().split(' ')[0])) {
      pillarNote = `MISMATCH: DB has "${dbPillar}"`;
    }

    return {
      'TR Row': tr.row,
      'Year': tr.year,
      'Country': tr.country,
      'TR Pillar': tr.pillar,
      'TR Program Name': tr.name,
      'TR Donor': tr.donor,
      'DB Slug': tr.dbSlug || '',
      'DB Title': db?.titleEn || '',
      'Photos': realPhotos,
      'Cover': db ? (coverIsReal ? 'Real' : 'Placeholder') : '',
      'Photo Folder': tr.photoFolder || '',
      'STATUS': status,
      'Pillar Check': pillarNote,
      'Notes': tr.note || '',
    };
  });

  const ws1 = XLSX.utils.json_to_sheet(sheet1);
  ws1['!cols'] = [
    { wch: 7 }, { wch: 10 }, { wch: 20 }, { wch: 35 }, { wch: 60 },
    { wch: 45 }, { wch: 48 }, { wch: 55 }, { wch: 8 }, { wch: 12 },
    { wch: 25 }, { wch: 18 }, { wch: 30 }, { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Track Record Cross-Ref');

  // ════════════════════════════════════════
  // SHEET 2: DB Programs NOT in Track Record
  // ════════════════════════════════════════
  const trSlugs = new Set(trackRecord.filter(t => t.dbSlug).map(t => t.dbSlug));
  const orphanDB = programs.filter(p => !trSlugs.has(p.slug));

  const sheet2 = orphanDB.map(p => {
    const realPhotos = p.images.filter(i => i.imageUrl.includes('/images/projects/')).length;
    return {
      'Slug': p.slug,
      'Title': p.titleEn,
      'Year': p.year || '',
      'Status': p.status,
      'Pillar': p.pillar?.titleEn || '',
      'Donor': p.donorEn || '',
      'Photos': realPhotos,
      'ACTION': 'Check if this should be removed or is a variant of a Track Record program',
    };
  });

  const ws2 = XLSX.utils.json_to_sheet(sheet2);
  ws2['!cols'] = [{ wch: 48 }, { wch: 55 }, { wch: 8 }, { wch: 12 }, { wch: 22 }, { wch: 35 }, { wch: 8 }, { wch: 55 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'DB Not in Track Record');

  // ════════════════════════════════════════
  // SHEET 3: Programs Missing from DB
  // ════════════════════════════════════════
  const missingFromDB = trackRecord.filter(t => !t.dbSlug);
  const sheet3 = missingFromDB.map(t => ({
    'TR Row': t.row,
    'Year': t.year,
    'Country': t.country,
    'Pillar': t.pillar,
    'Program Name': t.name,
    'Donor': t.donor,
    'ACTION': 'Create new program in DB',
    'Notes': t.note || '',
  }));

  const ws3 = XLSX.utils.json_to_sheet(sheet3);
  ws3['!cols'] = [{ wch: 7 }, { wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 60 }, { wch: 45 }, { wch: 25 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Missing from DB');

  // ════════════════════════════════════════
  // SHEET 4: Photo Status Summary
  // ════════════════════════════════════════
  const withPhotos = programs.filter(p => p.images.some(i => i.imageUrl.includes('/images/projects/')));
  const withRealCover = programs.filter(p => p.coverImageUrl?.includes('/images/projects/'));
  const totalRealPhotos = programs.reduce((sum, p) => sum + p.images.filter(i => i.imageUrl.includes('/images/projects/')).length, 0);

  const summary = [
    { 'Metric': '── TRACK RECORD ──', 'Value': '' },
    { 'Metric': 'Total Programs in Track Record', 'Value': trackRecord.length },
    { 'Metric': 'Unique Programs (GITS = 1)', 'Value': trackRecord.length - 2 },
    { 'Metric': 'Matched to DB', 'Value': trackRecord.filter(t => t.dbSlug && dbMap[t.dbSlug]).length },
    { 'Metric': 'NOT in DB (need creation)', 'Value': missingFromDB.length },
    { 'Metric': '', 'Value': '' },
    { 'Metric': '── DATABASE ──', 'Value': '' },
    { 'Metric': 'Total Programs in DB', 'Value': programs.length },
    { 'Metric': 'Matched to Track Record', 'Value': programs.length - orphanDB.length },
    { 'Metric': 'NOT in Track Record (orphans)', 'Value': orphanDB.length },
    { 'Metric': '', 'Value': '' },
    { 'Metric': '── PHOTOS ──', 'Value': '' },
    { 'Metric': 'Photo Folders Available', 'Value': 12 },
    { 'Metric': 'Programs with Real Photos', 'Value': withPhotos.length },
    { 'Metric': 'Programs with Real Cover', 'Value': withRealCover.length },
    { 'Metric': 'Programs with NO Photos', 'Value': programs.length - withPhotos.length },
    { 'Metric': 'Total Real Photos in DB', 'Value': totalRealPhotos },
    { 'Metric': '', 'Value': '' },
    { 'Metric': '── PHOTO CONFIRMATIONS (from Track Record) ──', 'Value': '' },
    { 'Metric': 'ILO folder → ENABLE SIYB Training 2024', 'Value': 'CONFIRMED ✓' },
    { 'Metric': 'UNFIL folder → Women-led Social Enterprises 2021', 'Value': 'CONFIRMED ✓' },
    { 'Metric': 'Nawara/IRC folder → SRP2 Economic Empowerment GBV', 'Value': 'CONFIRMED ✓' },
  ];

  const ws4 = XLSX.utils.json_to_sheet(summary);
  ws4['!cols'] = [{ wch: 52 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws4, 'Summary');

  const outPath = 'C:\\Users\\Marketing Manager\\Desktop\\track-record-cross-reference.xlsx';
  XLSX.writeFile(wb, outPath);

  console.log(`\nExported to: ${outPath}\n`);

  console.log('=== CROSS-REFERENCE RESULTS ===\n');

  console.log(`Track Record: ${trackRecord.length} rows (${trackRecord.length - 2} unique programs, GITS has 3 editions)`);
  console.log(`DB Programs: ${programs.length}`);
  console.log(`Matched: ${programs.length - orphanDB.length} programs`);
  console.log(`Missing from DB: ${missingFromDB.length} programs`);
  console.log(`DB orphans (not in Track Record): ${orphanDB.length}`);

  console.log(`\n--- MISSING FROM DB ---`);
  missingFromDB.forEach(t => console.log(`  Row ${t.row}: ${t.name} (${t.year}, ${t.donor})`));

  console.log(`\n--- DB ORPHANS ---`);
  orphanDB.forEach(p => console.log(`  ${p.slug} — ${p.titleEn}`));

  console.log(`\n--- PHOTO STATUS ---`);
  console.log(`With real photos: ${withPhotos.length} / ${programs.length}`);
  console.log(`With real cover: ${withRealCover.length} / ${programs.length}`);
  console.log(`Total real photos: ${totalRealPhotos}`);

  console.log(`\n--- PREVIOUSLY FLAGGED MAPPINGS — NOW CONFIRMED ---`);
  console.log(`  ILO folder → enable-siyb-training-2024 (ENABLE/SIYB, EU & ILO) ✓`);
  console.log(`  UNFIL folder → unifil-women-social-enterprises (2021, UNIFIL) ✓`);
  console.log(`  nawara-IRC folder → srp2-economic-empowerment-sgbv (SRP2, IRC & World Bank) ✓`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
