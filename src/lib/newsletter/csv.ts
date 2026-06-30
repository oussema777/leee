export interface ParsedContact {
  email: string;
  name: string | null;
  tags: string[];
}

export interface CsvImportResult {
  valid: ParsedContact[];
  invalid: number;
  duplicates: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Minimal CSV: handles quoted fields and embedded commas. No external dep.
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseContactsCsv(raw: string): CsvImportResult {
  const lines = raw.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim() !== "");
  if (lines.length === 0) throw new Error("Empty CSV");

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const emailIdx = header.indexOf("email");
  if (emailIdx === -1) throw new Error("Missing email column in CSV");
  const nameIdx = header.indexOf("name");
  const tagsIdx = header.indexOf("tags");

  const valid: ParsedContact[] = [];
  const seen = new Set<string>();
  let invalid = 0;
  let duplicates = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const email = (cols[emailIdx] || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) { invalid++; continue; }
    if (seen.has(email)) { duplicates++; continue; }
    seen.add(email);
    const name = nameIdx >= 0 ? (cols[nameIdx] || "").trim() : "";
    const tagsRaw = tagsIdx >= 0 ? (cols[tagsIdx] || "") : "";
    const tags = tagsRaw.split(";").map((t) => t.trim()).filter(Boolean);
    valid.push({ email, name: name || null, tags });
  }

  return { valid, invalid, duplicates };
}
