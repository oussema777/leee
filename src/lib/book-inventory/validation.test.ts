import { describe, expect, it } from "vitest";
import { bookInventorySchema } from "./validation";

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
});
