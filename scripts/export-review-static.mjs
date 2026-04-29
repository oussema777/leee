import XLSX from 'xlsx';

// All 24 DB programs (captured from last DB query)
const dbPrograms = [
  { slug: 'business-development-youth-north', title: 'Business Development & Capacity Building for Youth', year: 2023, status: 'COMPLETED', pillar: 'Technical Assistance', location: 'North Lebanon', donor: 'Utopia & Oxfam', cover: '/images/international-professionals.jpg', realPhotos: 0 },
  { slug: 'capacity-building-farmers-cooperatives', title: 'Capacity Building for Farmers & Cooperatives', year: 2021, status: 'COMPLETED', pillar: 'Technical Assistance', location: 'Lebanon', donor: 'Action Against Hunger', cover: '/images/field-visit-rural.jpg', realPhotos: 0 },
  { slug: 'cash-for-work-food-relief-north', title: 'Cash for Work for Food Relief in the North', year: 2025, status: 'ACTIVE', pillar: 'LEE Humanitarian Aid', location: 'North Lebanon', donor: 'Norway Embassy & UNDP Lebanon', cover: '/images/outdoor-certificate-ceremony.jpg', realPhotos: 0 },
  { slug: 'community-kitchens-social-cohesion', title: 'Community Kitchen Initiative — Building CSO Capacity', year: 2024, status: 'ACTIVE', pillar: 'LEE Humanitarian Aid', location: 'West Beqaa, Zahle, Upper Chouf', donor: 'GIZ & International Alert', cover: '/images/certificate-presentation.jpg', realPhotos: 0 },
  { slug: 'unifil-women-social-enterprises', title: 'Creating Job Opportunities Through Women-led Social Enterprises', year: 2021, status: 'COMPLETED', pillar: 'LEE Incubators', location: 'South Lebanon', donor: 'UNIFIL', cover: '/images/nawra-women-training.jpg', realPhotos: 4 },
  { slug: 'digital-learning-women-sustainable-business', title: 'Digital Learning for Women Sustainable Business', year: 2023, status: 'COMPLETED', pillar: 'LEE Academy', location: 'Lebanon, Egypt, Morocco, Tunisia, Algeria, Jordan', donor: 'CAWTAR & Kvinna till Kvinna', cover: '/images/nawra-women-training.jpg', realPhotos: 0 },
  { slug: 'digital-media-campaigns-women-empowerment', title: "Digital Media Campaigns for Women's Empowerment", year: 2022, status: 'COMPLETED', pillar: 'LEE Digital Media Hub', location: 'MENA Region', donor: 'CAWTAR & Kvinna till Kvinna', cover: '/images/women-empowerment-art.jpg', realPhotos: 0 },
  { slug: 'srp2-economic-empowerment-sgbv', title: 'Economic Empowerment for Survivors of GBV (SRP2)', year: 2025, status: 'ACTIVE', pillar: 'LEE Incubators', location: 'Beirut, Mount Lebanon, Bekaa', donor: 'IRC & World Bank', cover: '/images/nawra-dream-to-jury.jpg', realPhotos: 10 },
  { slug: 'empowering-women-entrepreneurs-mena', title: 'Empowering Women Entrepreneurs in MENA', year: 2022, status: 'COMPLETED', pillar: 'LEE Academy', location: '6 MENA countries', donor: 'CAWTAR & Kvinna till Kvinna', cover: '/images/women-empowerment-art.jpg', realPhotos: 10 },
  { slug: 'enable-siyb-training-2024', title: 'ENABLE Programme — SIYB Training', year: 2024, status: 'COMPLETED', pillar: 'LEE Academy', location: 'Beirut, Mt Lebanon, Akkar, South', donor: 'EU & ILO', cover: '/images/group-training-workshop.jpg', realPhotos: 7 },
  { slug: 'financial-education-women', title: 'Financial Education Capacity Building for Women', year: 2023, status: 'COMPLETED', pillar: 'LEE Academy', location: 'Bekaa, North, South, BML', donor: 'Lutheran World Relief & USAID', cover: '/images/certificate-presentation.jpg', realPhotos: 0 },
  { slug: 'psdp-gender-sensitive-business-support', title: 'Gender-Sensitive Business Support (PSDP)', year: 2022, status: 'COMPLETED', pillar: 'LEE Incubators', location: 'Lebanon', donor: 'Canada Embassy & ILO', cover: '/images/group-training-workshop.jpg', realPhotos: 10 },
  { slug: 'gits-global-investment-trade-summit-2025', title: 'Global Investment & Trade Summit — GITS 2025', year: 2025, status: 'COMPLETED', pillar: 'LEE Academy', location: 'Multi-country (MENA & Africa)', donor: 'GTS Seketak, AfriLabs, Falak, SUNI', cover: '/images/projects/gits-2.jpg', realPhotos: 10 },
  { slug: 'houla-women-green-fashion-factory', title: "Houla Women's Green Fashion Factory", year: 2023, status: 'COMPLETED', pillar: 'LEE Incubators', location: 'South Lebanon', donor: 'UNIFIL', cover: '/images/handcrafted-products.jpg', realPhotos: 0 },
  { slug: 'social-economic-resilience-vulnerable-communities', title: 'Improving Social & Economic Resilience', year: 2024, status: 'ACTIVE', pillar: 'LEE Business Clinic', location: 'Lebanon', donor: 'BMZ, RMF & Welthungerhilfe', cover: '/images/training-presentation.jpg', realPhotos: 0 },
  { slug: 'livelihoods-resilience-lebanese-syrians', title: 'Livelihoods & Resilience Support', year: 2023, status: 'COMPLETED', pillar: 'LEE Business Clinic', location: 'Lebanon', donor: 'WFP & Relief International', cover: '/images/mentoring-session.jpg', realPhotos: 3 },
  { slug: 'nawra-green-ventures-acceleration', title: 'NAWARA — Green Ventures Acceleration', year: 2025, status: 'ACTIVE', pillar: 'LEE Incubators', location: 'Lebanon, Tunisia, Morocco', donor: 'European Union', cover: '/images/nawra-dream-to-jury.jpg', realPhotos: 0 },
  { slug: 'optimizing-women-entrepreneurs-bekaa', title: 'Optimizing Women Entrepreneurs & Rural Communities', year: 2024, status: 'COMPLETED', pillar: 'LEE Business Clinic', location: 'Bekaa, Baalbeck-Hermel', donor: 'Solidarités International', cover: '/images/women-group-certificates.jpg', realPhotos: 0 },
  { slug: 'prospects-entrepreneurship-agriculture', title: 'Promoting Entrepreneurship in Agriculture (Prospects)', year: 2020, status: 'COMPLETED', pillar: 'LEE Incubators', location: 'Lebanon', donor: 'Netherlands Embassy & ILO', cover: '/images/field-visit-rural.jpg', realPhotos: 10 },
  { slug: 'unifil-women-aquaculture', title: 'Promoting Women in Aquaculture', year: 2022, status: 'COMPLETED', pillar: 'LEE Incubators', location: 'South Lebanon', donor: 'UNIFIL', cover: '/images/handcrafted-products.jpg', realPhotos: 0 },
  { slug: 'salama-pss-humanitarian-2020', title: 'Psychosocial Support — Salama & IPPF', year: 2020, status: 'COMPLETED', pillar: 'LEE Humanitarian Aid', location: 'Lebanon', donor: 'IPPF, Salama, SICD', cover: '/images/projects/salama-1.jpg', realPhotos: 10 },
  { slug: 'kims-ifc-senior-management-somalia', title: 'Senior Management Training — KIMS & IFC', year: 2024, status: 'ACTIVE', pillar: 'LEE Academy', location: 'Somalia', donor: 'KIMS, IFC, World Bank', cover: '/images/projects/kims-ifc-1.jpg', realPhotos: 10 },
  { slug: 'berytech-eu-startup-incubation-2023', title: 'Startup & Research Incubation — Berytech & EU', year: 2023, status: 'COMPLETED', pillar: 'LEE Incubators', location: 'Lebanon', donor: 'Berytech & EU', cover: '/images/projects/berytech-1.jpg', realPhotos: 7 },
  { slug: 'unifil-coop-south-strengthening', title: 'Strengthening Cooperatives in the South', year: 2022, status: 'COMPLETED', pillar: 'LEE Incubators', location: 'South Lebanon', donor: 'UNIFIL', cover: '/images/outdoor-certificate-ceremony.jpg', realPhotos: 0 },
];

// Photo integration mapping
const photoMapping = [
  { folder: 'CAWTAR 2022-2023', spreadsheetDonor: 'CAWTAR & Kvinna till Kvinna', spreadsheetTarget: '20 Partners across 6 countries', dbSlug: 'empowering-women-entrepreneurs-mena', photos: 10, match: 'CORRECT — same donor & pillar' },
  { folder: 'GTS seketak', spreadsheetDonor: 'GTS Seketak, AfriLabs, Falak, SUNI', spreadsheetTarget: 'Global Investment & Trade Summit', dbSlug: 'gits-global-investment-trade-summit-2025', photos: 10, match: 'NEW PROGRAM CREATED from spreadsheet' },
  { folder: 'IFC 2024', spreadsheetDonor: 'KIMS, IFC, World Bank', spreadsheetTarget: '20 Senior Management trained', dbSlug: 'kims-ifc-senior-management-somalia', photos: 10, match: 'NEW PROGRAM CREATED from spreadsheet' },
  { folder: 'ILO', spreadsheetDonor: 'EU & ILO', spreadsheetTarget: '300 Feasibility, 1000 Trained, 600 coaching', dbSlug: 'enable-siyb-training-2024', photos: 7, match: 'MATCHED by donor (EU & ILO) — review if correct program' },
  { folder: 'JCI 2022', spreadsheetDonor: 'JCI Lebanon', spreadsheetTarget: 'Partnership cooperation', dbSlug: '', photos: 0, match: 'SKIPPED — only 1 screenshot, no real photos' },
  { folder: 'PSDP 2022-2023', spreadsheetDonor: 'PSDP / Canada & ILO', spreadsheetTarget: 'Women skills development, partnerships', dbSlug: 'psdp-gender-sensitive-business-support', photos: 10, match: 'CORRECT — PSDP program matches' },
  { folder: 'UNFIL', spreadsheetDonor: 'UNIFIL', spreadsheetTarget: '25 green fashion, feasibility, grants', dbSlug: 'unifil-women-social-enterprises', photos: 4, match: 'REVIEW — 3 UNIFIL programs in DB, assigned to women-led social enterprises (2021)' },
  { folder: 'berytech', spreadsheetDonor: 'Berytech & EU', spreadsheetTarget: '16 Researchers & Startups incubated', dbSlug: 'berytech-eu-startup-incubation-2023', photos: 7, match: 'NEW PROGRAM CREATED from spreadsheet' },
  { folder: 'nawara program - IRC 2025', spreadsheetDonor: 'IRC', spreadsheetTarget: 'Women economic empowerment', dbSlug: 'srp2-economic-empowerment-sgbv', photos: 10, match: 'REVIEW — mapped to SRP2/IRC program, but may be a different IRC project' },
  { folder: 'prospects 2021', spreadsheetDonor: 'Netherlands Embassy, ILO, World Bank, UNICEF, IFC', spreadsheetTarget: '2000 startups, 150 feasibility, 59 incubated', dbSlug: 'prospects-entrepreneurship-agriculture', photos: 10, match: 'CORRECT — Prospects program matches' },
  { folder: 'relief', spreadsheetDonor: 'Relief International / WFP', spreadsheetTarget: '25 Staff partners trained', dbSlug: 'livelihoods-resilience-lebanese-syrians', photos: 3, match: 'CORRECT — same donor (WFP & Relief International)' },
  { folder: 'salama 2020', spreadsheetDonor: 'IPPF, Salama, SICD', spreadsheetTarget: '2500 PSS Sessions', dbSlug: 'salama-pss-humanitarian-2020', photos: 10, match: 'NEW PROGRAM CREATED from spreadsheet' },
];

// Build workbook
const wb = XLSX.utils.book_new();

// ── SHEET 1: Photo Integration Review ──
const ws1 = XLSX.utils.json_to_sheet(photoMapping.map(p => {
  const dbProg = dbPrograms.find(d => d.slug === p.dbSlug);
  return {
    'Photo Folder': p.folder,
    'Spreadsheet Donor': p.spreadsheetDonor,
    'Spreadsheet Target': p.spreadsheetTarget,
    'Matched DB Slug': p.dbSlug || 'N/A',
    'DB Program Title': dbProg?.title || 'N/A',
    'DB Donor': dbProg?.donor || 'N/A',
    'Photos Added': p.photos,
    'STATUS': p.photos > 0 ? 'DONE' : 'SKIPPED',
    'Match Quality': p.match,
  };
}));
ws1['!cols'] = [{ wch: 28 }, { wch: 40 }, { wch: 45 }, { wch: 48 }, { wch: 52 }, { wch: 38 }, { wch: 12 }, { wch: 10 }, { wch: 55 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Photo Mapping Review');

// ── SHEET 2: All DB Programs ──
const ws2 = XLSX.utils.json_to_sheet(dbPrograms.map(p => {
  const mapped = photoMapping.find(m => m.dbSlug === p.slug);
  return {
    'Slug': p.slug,
    'Title': p.title,
    'Year': p.year,
    'Program Status': p.status,
    'Pillar': p.pillar,
    'Location': p.location,
    'Donor': p.donor,
    'Cover Image': p.cover,
    'Cover Type': p.cover.includes('/images/projects/') ? 'Real Photo' : 'Placeholder',
    'Real Photos': p.realPhotos,
    'IMAGE STATUS': p.realPhotos > 0 ? `DONE (${p.realPhotos})` : 'NO PHOTOS',
    'Photo Folder': mapped?.folder || '',
  };
}));
ws2['!cols'] = [{ wch: 48 }, { wch: 55 }, { wch: 6 }, { wch: 12 }, { wch: 22 }, { wch: 30 }, { wch: 38 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 28 }];
XLSX.utils.book_append_sheet(wb, ws2, 'All DB Programs');

// ── SHEET 3: Summary ──
const summaryRows = [
  { 'Metric': 'Total Programs in DB', 'Count': dbPrograms.length },
  { 'Metric': 'Programs with REAL Photos', 'Count': dbPrograms.filter(p => p.realPhotos > 0).length },
  { 'Metric': 'Programs with Placeholder Cover Only', 'Count': dbPrograms.filter(p => p.realPhotos === 0).length },
  { 'Metric': 'Total Real Photos Added', 'Count': dbPrograms.reduce((sum, p) => sum + p.realPhotos, 0) },
  { 'Metric': '', 'Count': '' },
  { 'Metric': 'Photo Folders from Downloads', 'Count': 12 },
  { 'Metric': 'Successfully Mapped & Integrated', 'Count': photoMapping.filter(p => p.photos > 0).length },
  { 'Metric': 'Skipped (no usable photos)', 'Count': photoMapping.filter(p => p.photos === 0).length },
  { 'Metric': 'Mappings needing REVIEW', 'Count': photoMapping.filter(p => p.match.startsWith('REVIEW')).length },
];
const ws3 = XLSX.utils.json_to_sheet(summaryRows);
ws3['!cols'] = [{ wch: 40 }, { wch: 10 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Summary');

const outPath = 'C:\\Users\\Marketing Manager\\Desktop\\programs-review.xlsx';
XLSX.writeFile(wb, outPath);
console.log(`Exported to: ${outPath}`);
console.log(`3 sheets: Photo Mapping Review, All DB Programs, Summary`);
