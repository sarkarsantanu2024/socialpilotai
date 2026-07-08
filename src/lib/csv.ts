// Tiny dependency-free CSV parser + header mapper for bulk center import.
// Handles quoted fields, embedded commas/newlines, and "" escaped quotes.

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field); field = "";
    } else if (ch === "\n") {
      row.push(field); field = "";
      rows.push(row); row = [];
    } else field += ch;
  }
  // flush last field/row
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  // drop fully-empty rows
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export interface ImportedCenter {
  name: string;
  ownerName?: string;
  city?: string;
  locality?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  fbUrl?: string;
  type?: string;
}

const VALID_TYPES = ["abacus", "coaching", "gym", "playschool", "salon", "restaurant"];

// Map a header cell to a known field (flexible on wording/case/spacing). Order
// matters — more specific checks first so "owner name" ≠ "center name" etc.
function fieldFor(header: string): keyof ImportedCenter | null {
  const h = header.toLowerCase().replace(/[^a-z]/g, "");
  if (h.includes("owner") || h.includes("manager")) return "ownerName";
  if (h.includes("whatsapp")) return "whatsapp";
  if (h.includes("phone") || h.includes("mobile")) return "phone";
  if (h.includes("email") || h.includes("mail")) return "email";
  if (h.includes("locality") || h.includes("area") || h.includes("neighbourhood")) return "locality";
  if (h.includes("address") || h.includes("location")) return "address";
  if (h.includes("city") || h.includes("town")) return "city";
  if (h.includes("facebook") || h.includes("fb") || h.includes("page")) return "fbUrl";
  if (h.includes("type") || h.includes("category")) return "type";
  if (h.includes("center") || h.includes("centre") || h.includes("branch") || h.includes("business") || h.includes("name")) return "name";
  return null;
}

// Turn parsed CSV rows (with a header row) into center import objects.
export function rowsToCenters(rows: string[][]): ImportedCenter[] {
  if (!rows.length) return [];
  const header = rows[0];
  const cols = header.map(fieldFor);
  // If nothing mapped (no header), assume first col is the center name.
  const hasHeader = cols.some(Boolean);
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .map((r): ImportedCenter | null => {
      const rec: ImportedCenter = { name: "" };
      if (hasHeader) {
        cols.forEach((f, i) => { if (f) (rec[f] as string) = (r[i] ?? "").trim(); });
      } else {
        rec.name = (r[0] ?? "").trim();
        rec.city = (r[1] ?? "").trim();
      }
      if (rec.type) {
        const t = rec.type.toLowerCase().trim();
        rec.type = VALID_TYPES.includes(t) ? t : undefined;
      }
      return rec.name ? rec : null;
    })
    .filter((c): c is ImportedCenter => c !== null);
}

export const CSV_TEMPLATE =
  "Center Name,Owner Name,City,Locality,Address,Phone,WhatsApp,Email,Facebook Link,Type\n" +
  "MMA Ramnagar,Debdulal Mishra,Purba Medinipur,Ramnagar,\"Dakhin Basulipat, Ramnagar\",7407421404,917407421404,ramnagar@example.com,https://facebook.com/mmaramnagar,abacus\n" +
  "MMA Barasat,,Kolkata,Barasat,,,918000000000,,https://facebook.com/barasatMMA,abacus\n";
