/**
 * Minimal, safe CSV serialisation (RFC 4180 quoting + spreadsheet
 * formula-injection guard). No dependency needed for our column counts.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = value instanceof Date ? value.toISOString() : String(value);
  // Neutralise cells that spreadsheets would evaluate as formulas.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) lines.push(row.map(csvCell).join(","));
  // BOM so Excel opens UTF-8 correctly.
  return `﻿${lines.join("\r\n")}\r\n`;
}
