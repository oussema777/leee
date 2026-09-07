import { z } from 'zod';

export const BOOK_INVENTORY_STATUSES = ['AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED'] as const;
export const BOOK_CONDITIONS = ['EXCELLENT', 'GOOD', 'ACCEPTABLE'] as const;
export const BOOK_LANGUAGES = ['ARABIC', 'ENGLISH', 'FRENCH', 'OTHER'] as const;
export const BOOK_CATEGORIES = [
  'FICTION',
  'CHILDREN',
  'EDUCATION',
  'UNIVERSITY',
  'BUSINESS',
  'SELF_DEVELOPMENT',
  'RELIGION',
  'HISTORY',
  'OTHER',
] as const;
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
    publicationYear: optionalNumber(2_100),
    category: z.enum(BOOK_CATEGORIES),
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
  })
  .superRefine((value, context) => {
    if (value.isPublished && value.status !== 'AVAILABLE') {
      context.addIssue({ code: 'custom', path: ['status'], message: 'Published books must be available.' });
    }
    if (value.isPublished && value.stockQuantity < 1) {
      context.addIssue({ code: 'custom', path: ['stockQuantity'], message: 'Published books need at least one copy.' });
    }
    if (value.isPublished && !value.coverImageUrl) {
      context.addIssue({ code: 'custom', path: ['coverImageUrl'], message: 'Add a cover before publishing.' });
    }
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
