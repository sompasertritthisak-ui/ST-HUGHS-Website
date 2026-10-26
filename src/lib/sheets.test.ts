// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import vm from "node:vm";

vi.mock("server-only", () => ({}));
const rows = vi.hoisted(() => ({ list: [] as unknown[] }));
vi.mock("@/lib/prisma", () => ({ prisma: { enquiry: { findMany: vi.fn(async () => rows.list) } } }));

import { SHEET_COLUMNS, sheetSafe, sheetsSecretFingerprint, syncEnquiriesToSheet, toSheetRow } from "./sheets";

const enquiry = (over: Record<string, unknown> = {}) => ({
  id: "enq_1", type: "CONSULTATION", status: "NEW", name: "Noy", email: "noy@example.com", phone: "+856 20 5555 0000", country: "Laos",
  audience: "STUDENT", currentQualification: "Mor 7", message: "=HYPERLINK(\"http://x\")", source: "/consultation", referrer: null,
  utmSource: null, utmMedium: null, utmCampaign: null, consentMarketing: true, followUpAt: null,
  createdAt: new Date("2026-10-25T00:08:00Z"), updatedAt: new Date("2026-10-25T00:08:00Z"),
  programme: { title: "Business Administration", shortTitle: "BBA" }, destination: null,
  consultation: { preferredDate: new Date("2026-10-30T00:00:00Z"), preferredTime: "10:00", mode: "ONLINE" }, assignedTo: { name: "Mr.Dennis" },
  ...over,
});

describe("sheet rows", () => {
  it("never lets form text become a formula", () => {
    expect(sheetSafe("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(sheetSafe("+856 20")).toBe("'+856 20");
    expect(sheetSafe("-1")).toBe("'-1");
    expect(sheetSafe("@user")).toBe("'@user");
    expect(sheetSafe("Hello")).toBe("Hello");
    expect(sheetSafe(null)).toBe("");
  });
  it("maps an enquiry to every column, in Laos time", () => {
    const row = toSheetRow(enquiry() as never);
    expect(Object.keys(row).sort()).toEqual(SHEET_COLUMNS.map((c) => c.key).sort());
    expect(row.receivedAt).toBe("25/10/2026, 07:08");
    expect(row.consultationDate).toBe("2026-10-30");
    expect(row.message.startsWith("'=")).toBe(true);
    expect(row.programme).toBe("BBA");
    expect(row.assignedTo).toBe("Mr.Dennis");
    expect(row.consentMarketing).toBe("Yes");
    expect(row.type).toBe("Consultation");
    expect(row.status).toBe("New");
    expect(row.audience).toBe("Student");
    expect(row.consultationMode).toBe("Online video call");
  });
  it("has unique headers and the Enquiry ID first", () => {
    expect(new Set(SHEET_COLUMNS.map((c) => c.header)).size).toBe(SHEET_COLUMNS.length);
    expect(SHEET_COLUMNS[0]).toEqual({ key: "id", header: "Enquiry ID" });
  });
});

describe("syncEnquiriesToSheet", () => {
  const env = { ...process.env };
  beforeEach(() => { rows.list = [enquiry()]; });
  afterEach(() => { process.env = { ...env }; vi.unstubAllGlobals(); });

  it("does nothing until both settings exist", async () => {
    delete process.env.SHEETS_WEBHOOK_URL; delete process.env.SHEETS_WEBHOOK_SECRET;
    const f = vi.fn(); vi.stubGlobal("fetch", f);
    expect(await syncEnquiriesToSheet(["enq_1"])).toMatchObject({ ok: false, reason: "not-configured" });
    expect(f).not.toHaveBeenCalled();
  });
  it("posts the secret, the columns and the rows; reports the script's answer", async () => {
    process.env.SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/x/exec"; process.env.SHEETS_WEBHOOK_SECRET = "s3cret";
    const f = vi.fn(async () => new Response(JSON.stringify({ ok: true, added: 1, updated: 0 }), { status: 200 })); vi.stubGlobal("fetch", f);
    expect(await syncEnquiriesToSheet(["enq_1"])).toEqual({ ok: true, count: 1 });
    const body = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.secret).toBe("s3cret");
    expect(body.columns).toHaveLength(SHEET_COLUMNS.length);
    expect(body.rows[0].id).toBe("enq_1");
  });
  it("never throws: a wrong secret or a network failure is reported, not raised", async () => {
    process.env.SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/x/exec"; process.env.SHEETS_WEBHOOK_SECRET = "wrong";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: false, error: "unauthorised" }))));
    expect(await syncEnquiriesToSheet(["enq_1"])).toMatchObject({ ok: false, reason: "unauthorised" });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("network"); }));
    expect(await syncEnquiriesToSheet(["enq_1"])).toMatchObject({ ok: false });
  });
});

describe("sheetsSecretFingerprint", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("is the SHA-256 of the trimmed secret, and null when unset", () => {
    vi.stubEnv("SHEETS_WEBHOOK_SECRET", " right\n");
    expect(sheetsSecretFingerprint()).toBe(createHash("sha256").update("right").digest("hex"));
    vi.stubEnv("SHEETS_WEBHOOK_SECRET", "");
    expect(sheetsSecretFingerprint()).toBeNull();
  });
});

/** Runs docs/google-sheets-backup.gs against a simulated spreadsheet, so the upsert logic is proven before setup. */
describe("Apps Script (docs/google-sheets-backup.gs)", () => {
  /** Chainable stand-in for Sheets calls the tests do not inspect (styling: fonts, colours, banding, widths…). */
  const chain = (): unknown =>
    new Proxy(function () {}, { get: (_t, k) => (k === "then" ? undefined : chain()), apply: () => chain() });
  const styled: string[] = [];
  function fakeSheets() {
    const grid: unknown[][] = [];
    const cell = (r: number, c: number) => (grid[r - 1]?.[c - 1] ?? "");
    const withChain = <T extends object>(o: T) => new Proxy(o, { get: (t, k) => (k in t ? (t as Record<string | symbol, unknown>)[k] : (styled.push(String(k)), chain())) });
    const sheet = withChain({
      getLastRow: () => grid.length,
      getLastColumn: () => Math.max(0, ...grid.map((r) => r.length)),
      getMaxRows: () => 1000,
      getBandings: () => [],
      getRange: (r: number, c: number, nr: number, nc: number) =>
        withChain({
          getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => cell(r + i, c + j))),
          setValues: (vals: unknown[][]) => { vals.forEach((row, i) => { grid[r - 1 + i] ??= []; row.forEach((v, j) => (grid[r - 1 + i][c - 1 + j] = v)); }); return chain(); },
        }),
      appendRow: (row: unknown[]) => grid.push([...row]),
    });
    return { grid, sheet };
  }
  function load(secret: string) {
    const { grid, sheet } = fakeSheets();
    // The script stores the fingerprint; "PASTE…" and non-hex values are passed through to test the setup errors.
    const stored = /^PASTE-|^not-hex/.test(secret) ? secret : createHash("sha256").update(secret.trim(), "utf8").digest("hex");
    const src = readFileSync("docs/google-sheets-backup.gs", "utf8").replace('"PASTE-THE-FINGERPRINT-HERE"', JSON.stringify(stored));
    const ctx = vm.createContext({
      SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => null, insertSheet: () => sheet }), newConditionalFormatRule: () => chain(), BandingTheme: { BLUE: "BLUE" }, BorderStyle: { SOLID_THICK: "SOLID_THICK" }, getUi: () => chain() },
      Utilities: {
        // Apps Script returns signed bytes
        computeDigest: (_alg: string, text: string) => [...createHash("sha256").update(text, "utf8").digest()].map((b) => (b > 127 ? b - 256 : b)),
        DigestAlgorithm: { SHA_256: "SHA_256" },
        Charset: { UTF_8: "UTF_8" },
      },
      LockService: { getScriptLock: () => ({ waitLock: () => undefined, releaseLock: () => undefined }) },
      ContentService: { createTextOutput: (t: string) => ({ setMimeType: () => JSON.parse(t) }), MimeType: { JSON: "json" } },
    });
    vm.runInContext(src, ctx);
    const post = (body: unknown) => (ctx as unknown as { doPost: (e: unknown) => { ok: boolean; added?: number; updated?: number; error?: string } }).doPost({ postData: { contents: JSON.stringify(body) } });
    return { grid, post };
  }
  const columns = SHEET_COLUMNS;
  const row = (over: Record<string, string> = {}) => ({ ...toSheetRow(enquiry() as never), ...over });

  it("rejects a wrong secret and the placeholder", () => {
    expect(load("right").post({ secret: "wrong", columns, rows: [row()] })).toMatchObject({ ok: false, error: "unauthorised" });
    const { post } = load("PASTE-THE-FINGERPRINT-HERE");
    expect(post({ secret: "PASTE-THE-FINGERPRINT-HERE", columns, rows: [row()] })).toMatchObject({ ok: false, error: "secret-not-set" });
    // the phrase pasted where the fingerprint belongs
    expect(load("not-hex phrase").post({ secret: "not-hex phrase", columns, rows: [row()] })).toMatchObject({ ok: false, error: "secret-not-fingerprint" });
  });
  it("stores only the fingerprint: the fingerprint itself is not accepted as the secret", () => {
    const fingerprint = createHash("sha256").update("right", "utf8").digest("hex");
    expect(load("right").post({ secret: fingerprint, columns, rows: [row()] })).toMatchObject({ ok: false, error: "unauthorised" });
  });
  it("ignores spaces pasted around either phrase", () => {
    expect(load(" right ").post({ secret: "right\n", columns, rows: [row()] })).toMatchObject({ ok: true, added: 1 });
  });
  it("writes headers, adds new enquiries and updates existing ones by Enquiry ID", () => {
    const { grid, post } = load("right");
    expect(post({ secret: "right", columns, rows: [row(), row({ id: "enq_2", name: "Bee" })] })).toMatchObject({ ok: true, added: 2, updated: 0 });
    expect(grid[0][0]).toBe("Enquiry ID");
    expect(grid).toHaveLength(3);
    expect(styled).toEqual(expect.arrayContaining(["setTabColor", "setFrozenRows", "applyRowBanding", "setConditionalFormatRules", "setColumnWidth"]));
    expect(post({ secret: "right", columns, rows: [row({ status: "Contacted" })] })).toMatchObject({ ok: true, added: 0, updated: 1 });
    expect(grid).toHaveLength(3); // no duplicate
    expect(grid[1][grid[0].indexOf("Status")]).toBe("Contacted");
  });
  it("keeps a column staff added by hand", () => {
    const { grid, post } = load("right");
    post({ secret: "right", columns, rows: [row()] });
    grid[0].push("Staff notes"); grid[1].push("Called on Monday");
    post({ secret: "right", columns, rows: [row({ status: "Qualified" })] });
    expect(grid[1][grid[0].indexOf("Staff notes")]).toBe("Called on Monday");
    expect(grid[1][grid[0].indexOf("Status")]).toBe("Qualified");
  });
});
