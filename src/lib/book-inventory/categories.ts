export const BOOK_CATEGORIES = [
  'FICTION', 'CHILDREN', 'EDUCATION', 'UNIVERSITY', 'BUSINESS',
  'SELF_DEVELOPMENT', 'RELIGION', 'HISTORY', 'OTHER',
] as const;

export type BookCategory = (typeof BOOK_CATEGORIES)[number];
export const BOOK_SELECTABLE_CATEGORIES = BOOK_CATEGORIES.filter(
  (category) => category !== 'CHILDREN' && category !== 'RELIGION'
);
export const MAX_BOOK_CATEGORIES = 20;

const categoryLabels: Record<BookCategory, readonly [string, string]> = {
  FICTION: ['Fiction', 'روايات'],
  CHILDREN: ['Children', 'أطفال'],
  EDUCATION: ['Education', 'تعليم'],
  UNIVERSITY: ['University', 'جامعي'],
  BUSINESS: ['Business', 'أعمال'],
  SELF_DEVELOPMENT: ['Self-development', 'تطوير ذاتي'],
  RELIGION: ['Religion', 'دين'],
  HISTORY: ['History', 'تاريخ'],
  OTHER: ['Other', 'أخرى'],
};

const categoryKey = (value: string) => value.trim().replace(/[_\s-]+/g, ' ').toLowerCase();

export function normalizeBookCategory(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return BOOK_CATEGORIES.find((category) => categoryKey(category) === categoryKey(trimmed)) || trimmed;
}

export function normalizeBookCategories(values: readonly string[]): string[] {
  const seen = new Set<string>();
  return values.map(normalizeBookCategory).filter((category) => {
    const key = category.toLowerCase();
    if (!category || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function bookCategoryLabel(category: string, isArabic = false): string {
  const normalized = normalizeBookCategory(category);
  return categoryLabels[normalized as BookCategory]?.[isArabic ? 1 : 0] || normalized;
}

interface CategorizedBook {
  categories?: readonly string[] | null;
  category?: string | null;
  customCategory?: string | null;
}

// Older records keep their original category until they are saved with tags.
export function getBookCategories(book: CategorizedBook): string[] {
  if (book.categories?.length) return normalizeBookCategories(book.categories);
  const legacyCategory = book.customCategory || book.category;
  return legacyCategory ? normalizeBookCategories([legacyCategory]) : [];
}

export function bookHasCategory(book: CategorizedBook, category: string): boolean {
  const key = normalizeBookCategory(category).toLowerCase();
  return getBookCategories(book).some((value) => value.toLowerCase() === key);
}

export function getBookCategoryOptions(saved: readonly string[] = []): string[] {
  return normalizeBookCategories([...BOOK_SELECTABLE_CATEGORIES, ...saved]).filter(
    (category) => !['OTHER', 'CHILDREN', 'RELIGION'].includes(category)
  );
}

export function primaryBookCategory(categories: readonly string[]) {
  const first = normalizeBookCategory(categories[0]);
  const standard = BOOK_CATEGORIES.find((category) => category === first && category !== 'OTHER');
  return {
    category: (standard || 'OTHER') as BookCategory,
    customCategory: standard ? null : first,
  };
}
