import { describe, it, expect } from "vitest";
import { parseContactsCsv } from "./csv";

describe("parseContactsCsv", () => {
  it("parses valid rows, lowercases + trims email, splits tags", () => {
    const csv = "email,name,tags\n  Alice@LEEE.com ,Alice,EN;partners\n";
    const r = parseContactsCsv(csv);
    expect(r.valid).toEqual([
      { email: "alice@leee.com", name: "Alice", tags: ["EN", "partners"] },
    ]);
    expect(r.invalid).toBe(0);
    expect(r.duplicates).toBe(0);
  });

  it("drops invalid and empty emails, counting them", () => {
    const csv = "email,name,tags\nnotanemail,Bob,EN\n,Empty,EN\ngood@x.com,Good,";
    const r = parseContactsCsv(csv);
    expect(r.valid.map((v) => v.email)).toEqual(["good@x.com"]);
    expect(r.invalid).toBe(2);
  });

  it("dedupes within the file by email (first wins), counting duplicates", () => {
    const csv = "email,name,tags\na@x.com,A1,EN\na@x.com,A2,AR";
    const r = parseContactsCsv(csv);
    expect(r.valid).toHaveLength(1);
    expect(r.valid[0].name).toBe("A1");
    expect(r.duplicates).toBe(1);
  });

  it("handles missing optional name and tags", () => {
    const csv = "email,name,tags\nc@x.com,,";
    const r = parseContactsCsv(csv);
    expect(r.valid[0]).toEqual({ email: "c@x.com", name: null, tags: [] });
  });

  it("rejects a file with no email column", () => {
    expect(() => parseContactsCsv("foo,bar\n1,2")).toThrow(/email column/i);
  });
});
