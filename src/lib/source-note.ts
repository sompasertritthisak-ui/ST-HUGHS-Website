/**
 * Source notes are written for editors ("[DECK 6. IFY (NCUK) vENG.pdf p1-6] — timetable is an example only").
 * Visitors see a plain list of where the facts come from; file names, page numbers and editorial caveats stay in the CMS.
 */
const KEYS: Record<string, string | null> = {
  "NCUK-SHV": "NCUK: St Hugh's College Vientiane",
  "NCUK-NEWS": "NCUK announcement, 28 February 2025",
  "NCUK-IFY": "NCUK: International Foundation Year",
  "NCUK-IY1": "NCUK: International Year One",
  "SHV-WEB": "sthughs.edu.la",
  "SHV-REF": null, // internal content reference, never shown
};

export function publicSourceNote(note: string | null | undefined): string | null {
  if (!note) return null;
  const main = note.split(/\s+[—–]\s+/)[0] ?? "";
  const out: string[] = [];
  const add = (label: string | null) => {
    if (label && !out.includes(label)) out.push(label);
  };
  const rest = main.replace(/\[([^\]]+)\]/g, (_, inner: string) => {
    const key = inner.trim();
    if (/^DECK\b/i.test(key)) add("SHV 2026–27 programme brochure");
    else if (key in KEYS) add(KEYS[key]);
    return " ";
  });
  // Keep any plain-language source an editor typed outside brackets (e.g. "Lao Ministry of Education and Sports").
  const plain = rest.replace(/\s+/g, " ").replace(/^[\s;,·]+|[\s;,·]+$/g, "");
  if (plain && !/\.pdf|\bp\d/i.test(plain)) add(plain);
  return out.length ? out.join(" · ") : null;
}
