export const BOOK_PACKAGES = {
  SINGLE: { priceCents: 500, paidBooks: 1, freeBooks: 0, totalBooks: 1 },
  FIVE: { priceCents: 2_500, paidBooks: 5, freeBooks: 0, totalBooks: 5 },
  TEN_PLUS_ONE: { priceCents: 5_000, paidBooks: 10, freeBooks: 1, totalBooks: 11 },
  TWENTY_PLUS_TWO: { priceCents: 8_000, paidBooks: 20, freeBooks: 2, totalBooks: 22 },
} as const;

export type BookPackageKey = keyof typeof BOOK_PACKAGES;
export const BOOK_PACKAGE_KEYS = Object.keys(BOOK_PACKAGES) as BookPackageKey[];

export const DELIVERY_FEE_CENTS = 400;

export const LEBANON_GOVERNORATES = [
  "BEIRUT", "MOUNT_LEBANON", "NORTH_LEBANON", "AKKAR", "BAALBEK_HERMEL",
  "BEQAA", "SOUTH_LEBANON", "NABATIEH", "KESERWAN_JBEIL",
] as const;

export function deliveryFeeCents(packageKey: BookPackageKey, fulfillmentMethod: string) {
  return fulfillmentMethod === "DELIVERY" && packageKey === "SINGLE" ? DELIVERY_FEE_CENTS : 0;
}

export function isFreeExtraIndex(packageKey: BookPackageKey, index: number) {
  return index >= BOOK_PACKAGES[packageKey].paidBooks;
}
