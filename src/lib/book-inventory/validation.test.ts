import { describe, expect, it } from "vitest";
import { BOOK_SELECTABLE_CATEGORIES, bookInventorySchema } from "./validation";

const validBook = {
  sku: "BK-260906-TEST01",
  title: "A Test Book",
  titleAr: null,
  author: "Test Author",
  authorAr: null,
  descriptionEn: null,
  descriptionAr: null,
  isbn: null,
  publisher: null,
  publicationYear: null,
  editions: [{ label: null, publicationYear: null, stockQuantity: 1, coverImageUrl: null }],
  category: "FICTION",
  language: "ENGLISH",
  condition: "GOOD",
  priceCents: 1200,
  currency: "USD",
  stockQuantity: 1,
  shelfLocation: null,
  coverImageUrl: "https://example.com/cover.jpg",
  status: "AVAILABLE",
  isPublished: true,
  internalNotes: null,
  sourceDonationId: null,
};

describe("bookInventorySchema", () => {
  it("accepts multiple editions with independent stock", () => {
    const editions = [{ label: "  2015 edition  ", publicationYear: 2015, stockQuantity: 2, coverImageUrl: null }, { label: "2021 edition", publicationYear: 2021, stockQuantity: 3, coverImageUrl: "https://example.com/2021.jpg" }];
    const result = bookInventorySchema.parse({ ...validBook, stockQuantity: 5, editions });
    expect(result.editions.map((edition) => edition.label)).toEqual(["2015 edition", "2021 edition"]);
    expect(bookInventorySchema.safeParse({ ...validBook, stockQuantity: 5, editions: editions.map((edition) => ({ ...edition, label: "Same" })) }).success).toBe(false);
  });
  it("saves multiple standard and custom categories", () => {
    const result = bookInventorySchema.parse({ ...validBook, category: undefined, categories: ["Fiction", "HISTORY", "Poetry"] });
    expect(result.categories).toEqual(["FICTION", "HISTORY", "Poetry"]);
    expect(result.category).toBe("FICTION");
    expect(result.customCategory).toBeNull();
  });

  it("keeps custom tags when one is the first selection", () => {
    const result = bookInventorySchema.parse({ ...validBook, categories: ["Poetry", "business"] });
    expect(result.categories).toEqual(["Poetry", "BUSINESS"]);
    expect(result.category).toBe("OTHER");
    expect(result.customCategory).toBe("Poetry");
  });

  it("does not restore a removed tag or leave an old custom category on save", () => {
    const result = bookInventorySchema.parse({ ...validBook, category: "OTHER", customCategory: "Poetry", categories: ["HISTORY"] });
    expect(result.categories).toEqual(["HISTORY"]);
    expect(result.category).toBe("HISTORY");
    expect(result.customCategory).toBeNull();
  });

  it("deduplicates equivalent category labels", () => {
    const result = bookInventorySchema.parse({ ...validBook, categories: ["Fiction", " fiction ", "Poetry", "poetry"] });
    expect(result.categories).toEqual(["FICTION", "Poetry"]);
  });

  it.each([[], [" "], ["OTHER"], ["x".repeat(81)]])("rejects empty or invalid category selections: %j", (...categories) => {
    const result = bookInventorySchema.safeParse({ ...validBook, categories });
    expect(result.success).toBe(false);
  });

  it("requires a selection when neither tags nor an original category are present", () => {
    expect(bookInventorySchema.safeParse({ ...validBook, category: undefined }).success).toBe(false);
  });

  it("normalizes nullable database fields when publishing an existing book", () => {
    const result = bookInventorySchema.safeParse(validBook);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.titleAr).toBeUndefined();
      expect(result.data.sourceDonationId).toBeUndefined();
    }
  });

  it("still requires a cover for a published book", () => {
    const result = bookInventorySchema.safeParse({ ...validBook, coverImageUrl: null });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Add a cover before publishing.");
    }
  });

  it("requires a name for an Other category", () => {
    const result = bookInventorySchema.safeParse({ ...validBook, category: "OTHER" });
    expect(result.success).toBe(false);
  });

  it("accepts a named custom category", () => {
    const result = bookInventorySchema.safeParse({ ...validBook, category: "OTHER", customCategory: "Poetry" });
    expect(result.success).toBe(true);
  });

  it.each(["CHILDREN", "RELIGION"])("does not offer the removed %s category", (category) => {
    expect(BOOK_SELECTABLE_CATEGORIES).not.toContain(category);
  });

  it("allows a published reserved book with no available copies", () => {
    const result = bookInventorySchema.safeParse({
      ...validBook,
      status: "RESERVED",
      stockQuantity: 0,
      editions: [{ label: null, publicationYear: null, stockQuantity: 0, coverImageUrl: null }],
    });

    expect(result.success).toBe(true);
  });

  it("rejects reserved books that still have available copies", () => {
    const result = bookInventorySchema.safeParse({
      ...validBook,
      status: "RESERVED",
      stockQuantity: 1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Reserved books cannot have available copies.");
    }
  });
});
