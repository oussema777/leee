import { z } from 'zod';
import { BOOK_CATEGORIES, MAX_BOOK_CATEGORIES, getBookCategories, normalizeBookCategories, normalizeBookCategory, primaryBookCategory } from './categories';

export { BOOK_CATEGORIES, BOOK_SELECTABLE_CATEGORIES } from './categories';

export const BOOK_INVENTORY_STATUSES = ['AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED'] as const;
export const BOOK_CONDITIONS = ['EXCELLENT', 'GOOD', 'ACCEPTABLE'] as const;
export const BOOK_LANGUAGES = ['ARABIC', 'ENGLISH', 'FRENCH', 'OTHER'] as const;

export const BOOK_CURRENCIES = ['USD', 'LBP'] as const;

const optionalText = (maximum: number) =>
  z.preprocess(
    (value) => (value == null || (typeof value === 'string' && value.trim() === '') ? undefined : value),
    z.string().trim().max(maximum).optional()
  );

const optionalUrl = z.preprocess(
  (value) => (value == null || (typeof value === 'string' && value.trim() === '') ? undefined : value),
  z.string().trim().url().max(2_000).refine(
    (value) => value.startsWith('https://') || value.startsWith('http://'),
    'Cover URL must use HTTP or HTTPS.'
  ).optional()
);

const optionalNumber = (maximum: number) =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.coerce.number().int().min(0).max(maximum).optional()
  );

export const bookInventorySchema = z
  .object({
    sku: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9-]{2,39}$/).optional()
    ),
    title: z.string().trim().min(2).max(200),
    titleAr: optionalText(200),
    author: z.string().trim().min(1).max(160),
    authorAr: optionalText(160),
    descriptionEn: optionalText(4_000),
    descriptionAr: optionalText(4_000),
    isbn: optionalText(40),
    publisher: optionalText(160),
    editions: z.array(z.object({
      id: optionalText(100),
      label: optionalText(100),
      publicationYear: optionalNumber(2_100),
      stockQuantity: z.coerce.number().int().min(0).max(10_000),
      coverImageUrl: optionalUrl,
    })).min(1, 'Add at least one edition.').max(50),
    publicationYear: optionalNumber(2_100),
    category: z.enum(BOOK_CATEGORIES).optional(),
    customCategory: optionalText(80),
    categories: z.array(z.string().trim().min(1).max(80).refine(
      (value) => normalizeBookCategory(value) !== 'OTHER',
      'Enter a specific category name instead of Other.'
    )).min(1, 'Select at least one category.').max(MAX_BOOK_CATEGORIES).optional(),
    language: z.enum(BOOK_LANGUAGES),
    condition: z.enum(BOOK_CONDITIONS),
    priceCents: z.coerce.number().int().min(0).max(100_000_000),
    currency: z.enum(BOOK_CURRENCIES),
    stockQuantity: z.coerce.number().int().min(0).max(10_000),
    shelfLocation: optionalText(100),
    coverImageUrl: optionalUrl,
    status: z.enum(BOOK_INVENTORY_STATUSES),
    isPublished: z.boolean(),
    internalNotes: optionalText(5_000),
    sourceDonationId: optionalText(100),
    donorId: optionalText(100),
    donorAllocations: z.array(z.object({
      id: optionalText(100),
      donorId: z.string().trim().min(1).max(100),
      stockQuantity: z.coerce.number().int().min(1).max(10_000),
    })).max(100).default([]),
  })
  .superRefine((value, context) => {
    const editionKeys = value.editions.map((edition) => (edition.label || '').toLocaleLowerCase());
    if (value.editions.length > 1 && value.editions.some((edition) => !edition.label)) {
      context.addIssue({ code: 'custom', path: ['editions'], message: 'Name every edition when a book has more than one.' });
    }
    if (new Set(editionKeys).size !== editionKeys.length) {
      context.addIssue({ code: 'custom', path: ['editions'], message: 'Edition names must be different.' });
    }
    const editionStock = value.editions.reduce((total, edition) => total + edition.stockQuantity, 0);
    if (value.stockQuantity !== editionStock) {
      context.addIssue({ code: 'custom', path: ['stockQuantity'], message: 'Book stock must match the total stock across editions.' });
    }
    const donorIds = value.donorAllocations.map((allocation) => allocation.donorId);
    if (new Set(donorIds).size !== donorIds.length) {
      context.addIssue({ code: 'custom', path: ['donorAllocations'], message: 'Each donor can only be added once.' });
    }
    const allocatedStock = value.donorAllocations.reduce((total, allocation) => total + allocation.stockQuantity, 0);
    if (value.donorAllocations.length > 0 && allocatedStock !== value.stockQuantity) {
      context.addIssue({ code: 'custom', path: ['donorAllocations'], message: 'Donor copy allocations must match the total number of copies.' });
    }
    if (value.categories === undefined) {
      if (!value.category) {
        context.addIssue({ code: 'custom', path: ['categories'], message: 'Select at least one category.' });
      }
      if (value.category === 'OTHER' && !value.customCategory) {
        context.addIssue({ code: 'custom', path: ['customCategory'], message: 'Enter a category name when Other is selected.' });
      }
      if (value.category !== 'OTHER' && value.customCategory) {
        context.addIssue({ code: 'custom', path: ['customCategory'], message: 'Custom categories can only be used with Other.' });
      }
    }
    if (value.isPublished && value.status !== 'AVAILABLE' && value.status !== 'RESERVED') {
      context.addIssue({ code: 'custom', path: ['status'], message: 'Published books must be available or reserved.' });
    }
    if (value.status === 'AVAILABLE' && value.stockQuantity < 1) {
      context.addIssue({ code: 'custom', path: ['stockQuantity'], message: 'Available books need at least one copy.' });
    }
    if (value.status === 'RESERVED' && value.stockQuantity !== 0) {
      context.addIssue({ code: 'custom', path: ['stockQuantity'], message: 'Reserved books cannot have available copies.' });
    }
    if (value.isPublished && !value.coverImageUrl) {
      context.addIssue({ code: 'custom', path: ['coverImageUrl'], message: 'Add a cover before publishing.' });
    }
  })
  .transform((value) => {
    const categories = value.categories === undefined
      ? getBookCategories(value)
      : normalizeBookCategories(value.categories);
    return { ...value, categories, ...primaryBookCategory(categories) };
  });

export type BookInventoryInput = z.infer<typeof bookInventorySchema>;

export function createInventorySlug(title: string, sku: string) {
  const titleSlug = title
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9 -]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[-_ ]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  return titleSlug + '-' + sku.toLowerCase();
}

export function createInventorySku() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(4));
  const suffix = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return 'BK-' + date + '-' + suffix;
}
