import { describe, expect, it } from "vitest";
import { catalogueCategoryWhere, parseCatalogueCategories } from "./catalogue-filters";

describe("catalogue category filters", () => {
  it("accepts existing single-category links and repeated multi-category parameters", () => {
    expect(parseCatalogueCategories("children")).toEqual(["CHILDREN"]);
    expect(parseCatalogueCategories([" fiction ", "FICTION", "Poetry", " "])).toEqual(["FICTION", "Poetry"]);
    expect(parseCatalogueCategories(undefined)).toEqual([]);
    expect(parseCatalogueCategories(["a".repeat(81)])).toEqual([]);
  });

  it("combines categories with OR for discovery and AND for overlap", () => {
    const any = catalogueCategoryWhere(["FICTION", "Poetry"], "any");
    const all = catalogueCategoryWhere(["FICTION", "Poetry"], "all");
    expect(any.OR).toHaveLength(2);
    expect(all.AND).toEqual(any.OR);
    expect(catalogueCategoryWhere([], "any")).toEqual({});
  });

  it("supports legacy books without matching their superseded category", () => {
    expect(catalogueCategoryWhere(["CHILDREN"], "any")).toEqual({ OR: [{ OR: [
      { categories: { has: "CHILDREN" } },
      { categories: { isEmpty: true }, customCategory: "CHILDREN" },
      { categories: { isEmpty: true }, customCategory: null, category: "CHILDREN" },
    ] }] });
    expect(catalogueCategoryWhere(["Poetry"], "all")).toEqual({ AND: [{ OR: [
      { categories: { has: "Poetry" } },
      { categories: { isEmpty: true }, customCategory: "Poetry" },
    ] }] });
  });
});
