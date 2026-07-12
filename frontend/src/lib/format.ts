export const money = (n: number | null | undefined) =>
  n == null ? "—" : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
export const num = (n: number | null | undefined, digits = 0) =>
  n == null ? "—" : Number(n).toLocaleString(undefined, { maximumFractionDigits: digits });
export const date = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : "—");
export const datetime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString() : "—";

export function toCSV(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const licenseChip = (expiry: string): "expired" | "soon" | "ok" => {
  const now = new Date();
  const e = new Date(expiry);
  const days = (e.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (days < 0) return "expired";
  if (days <= 30) return "soon";
  return "ok";
};
