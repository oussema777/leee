import type { Prisma } from "@prisma/client";
import { BOOK_CATEGORIES, MAX_BOOK_CATEGORIES, normalizeBookCategories } from "./categories";

export function parseCatalogueCategories(value?: string | string[]): string[] {
  return normalizeBookCategories((Array.isArray(value) ? value : value ? [value] : [])
    .filter(category => category.trim().length <= 80)).slice(0, MAX_BOOK_CATEGORIES);
}

// Match tags first; only use the legacy fields when the book has no tags.
export function catalogueCategoryWhere(categories: string[], match: "any" | "all"): Prisma.BookInventoryItemWhereInput {
  if (!categories.length) return {};
  const clauses: Prisma.BookInventoryItemWhereInput[] = categories.map(category => ({ OR: [
    { categories: { has: category } },
    { categories: { isEmpty: true }, customCategory: category },
    ...(BOOK_CATEGORIES.includes(category as (typeof BOOK_CATEGORIES)[number])
      ? [{ categories: { isEmpty: true }, customCategory: null, category: category as (typeof BOOK_CATEGORIES)[number] }]
      : []),
  ] }));
  return match === "all" ? { AND: clauses } : { OR: clauses };
}
