import { describe, expect, it } from "vitest";
import { bookCategoryLabel, bookHasCategory, getBookCategories, getBookCategoryOptions, normalizeBookCategories } from "./categories";

describe("book category compatibility", () => {
  it("keeps original standard and custom categories on existing books", () => {
    expect(getBookCategories({ category: "FICTION", categories: [] })).toEqual(["FICTION"]);
    expect(getBookCategories({ category: "OTHER", customCategory: "Poetry" })).toEqual(["Poetry"]);
  });

  it("uses saved tags without restoring a removed original category", () => {
    expect(getBookCategories({ category: "FICTION", categories: ["HISTORY", "Poetry"] })).toEqual(["HISTORY", "Poetry"]);
  });

  it("normalizes labels and avoids duplicate selections", () => {
    expect(normalizeBookCategories([" Fiction ", "FICTION", "self development", "Self-development", " Poetry ", "poetry"]))
      .toEqual(["FICTION", "SELF_DEVELOPMENT", "Poetry"]);
  });

  it("finds a book by any selected category", () => {
    const book = { category: "FICTION", categories: ["FICTION", "HISTORY", "Poetry"] };
    expect(bookHasCategory(book, "history")).toBe(true);
    expect(bookHasCategory(book, "poetry")).toBe(true);
    expect(bookHasCategory(book, "BUSINESS")).toBe(false);
  });

  it("localizes standard tags and preserves custom names", () => {
    expect(bookCategoryLabel("BUSINESS", true)).toBe("أعمال");
    expect(bookCategoryLabel("Poetry", true)).toBe("Poetry");
  });

  it("offers saved tags once and keeps removed defaults out of the picker", () => {
    const options = getBookCategoryOptions(["Poetry", "poetry", "Fiction", "Children", "Religion"]);
    expect(options.filter((value) => value.toLowerCase() === "poetry")).toHaveLength(1);
    expect(options.filter((value) => value === "FICTION")).toHaveLength(1);
    expect(options).not.toContain("CHILDREN");
    expect(options).not.toContain("RELIGION");
    expect(options).not.toContain("OTHER");
  });
});
