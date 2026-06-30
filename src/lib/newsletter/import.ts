import type { ParsedContact } from "./csv";

export interface ImportPlan {
  toUpsert: ParsedContact[];
  suppressedKeptOff: number;
}

export function planImport(rows: ParsedContact[], suppressed: Set<string>): ImportPlan {
  const toUpsert: ParsedContact[] = [];
  let suppressedKeptOff = 0;
  for (const r of rows) {
    if (suppressed.has(r.email)) { suppressedKeptOff++; continue; }
    toUpsert.push(r);
  }
  return { toUpsert, suppressedKeptOff };
}
