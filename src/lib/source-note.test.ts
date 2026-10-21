// @vitest-environment node
import { describe, it, expect } from "vitest";
import { publicSourceNote } from "./source-note";

describe("publicSourceNote", () => {
  it("turns deck references and caveats into a plain source list", () => {
    expect(publicSourceNote("[NCUK-SHV] [NCUK-NEWS] [DECK 6. IFY (NCUK) vENG.pdf p1-6] — SHV timetable is an example only (p11)")).toBe(
      "NCUK: St Hugh's College Vientiane · NCUK announcement, 28 February 2025 · SHV 2026–27 programme brochure",
    );
    expect(publicSourceNote("[DECK 1b. BBA-EI Gen AI (SHV+NUOL) vENG.pdf p1-2] — fees are NOT stated in the deck")).toBe("SHV 2026–27 programme brochure");
  });
  it("hides internal-only references and keeps plain editor text", () => {
    expect(publicSourceNote("[SHV-REF]")).toBeNull();
    expect(publicSourceNote("Lao Ministry of Education and Sports")).toBe("Lao Ministry of Education and Sports");
    expect(publicSourceNote(null)).toBeNull();
  });
});
