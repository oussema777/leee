export const BOOK_PACKAGES = {
  SINGLE: { priceCents: 500, paidBooks: 1, freeBooks: 0, totalBooks: 1 },
  FIVE: { priceCents: 2_500, paidBooks: 5, freeBooks: 0, totalBooks: 5 },
  TEN_PLUS_ONE: { priceCents: 5_000, paidBooks: 10, freeBooks: 1, totalBooks: 11 },
  TWENTY_PLUS_TWO: { priceCents: 8_000, paidBooks: 20, freeBooks: 2, totalBooks: 22 },
} as const;

export type BookPackageKey = keyof typeof BOOK_PACKAGES;
export const BOOK_PACKAGE_KEYS = Object.keys(BOOK_PACKAGES) as BookPackageKey[];

export function isFreeExtraIndex(packageKey: BookPackageKey, index: number) {
  return index >= BOOK_PACKAGES[packageKey].paidBooks;
}

