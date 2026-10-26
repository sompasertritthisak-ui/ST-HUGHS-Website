import { describe, it, expect } from "vitest";
import { inflateRawSync } from "node:zlib";
import { columnName, crc32, excelSerial, toXlsx, xmlText } from "./xlsx";

/** Reads every file out of a ZIP built by toXlsx (local headers in order). */
function unzip(buf: Buffer): Record<string, string> {
  const files: Record<string, string> = {};
  for (let at = 0; buf.readUInt32LE(at) === 0x04034b50; ) {
    const size = buf.readUInt32LE(at + 18);
    const nameLen = buf.readUInt16LE(at + 26);
    const name = buf.subarray(at + 30, at + 30 + nameLen).toString("utf8");
    const body = buf.subarray(at + 30 + nameLen, at + 30 + nameLen + size);
    const raw = inflateRawSync(body);
    expect(crc32(raw)).toBe(buf.readUInt32LE(at + 14));
    files[name] = raw.toString("utf8");
    at += 30 + nameLen + size;
  }
  return files;
}

describe("xlsx helpers", () => {
  it("crc32 matches the standard check value", () => {
    expect(crc32(Buffer.from("123456789"))).toBe(0xcbf43926);
  });
  it("names columns like Excel", () => {
    expect([0, 25, 26, 27, 701, 702].map(columnName)).toEqual(["A", "Z", "AA", "AB", "ZZ", "AAA"]);
  });
  it("converts instants to Laos wall-clock date serials", () => {
    // 04:34:38 UTC = 11:34:38 in Vientiane (UTC+7)
    expect(excelSerial(new Date("2026-10-26T04:34:38Z"), "Asia/Vientiane")).toBeCloseTo(Date.UTC(2026, 9, 26, 11, 34, 38) / 86_400_000 + 25_569, 8);
  });
  it("escapes XML and drops characters XML cannot hold", () => {
    expect(xmlText(`a & <b> "c"\u0007\uD800`)).toBe("a &amp; &lt;b&gt; &quot;c&quot;");
  });
});

describe("toXlsx", () => {
  const columns = [
    { header: "Received", kind: "datetime" as const },
    { header: "Name" },
    { header: "Phone" },
    { header: "Message", kind: "wrap" as const },
  ];
  const book = toXlsx(
    "Enquiries",
    columns,
    [
      [new Date("2026-10-26T04:34:38Z"), "ສົມພະເສີດ", "+85620 96561031", "Hello, \"world\"\nline 2"],
      [new Date("2026-10-27T00:00:00Z"), "=HYPERLINK(\"x\")", null, undefined],
    ],
    "Asia/Vientiane",
  );
  const files = unzip(book);
  const sheet = files["xl/worksheets/sheet1.xml"];

  it("is a complete workbook package", () => {
    expect(Object.keys(files).sort()).toEqual(["[Content_Types].xml", "_rels/.rels", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/workbook.xml", "xl/worksheets/sheet1.xml"]);
    expect(files["xl/workbook.xml"]).toContain(`<sheet name="Enquiries"`);
  });
  it("puts every value in its own cell — no separators to misread", () => {
    expect(sheet).toContain(`<c r="B2" s="2" t="inlineStr"><is><t xml:space="preserve">ສົມພະເສີດ</t></is></c>`);
    expect(sheet).toContain(`<t xml:space="preserve">+85620 96561031</t>`); // no "'" prefix needed
    expect(sheet).toContain(`<t xml:space="preserve">Hello, &quot;world&quot;\nline 2</t>`);
  });
  it("never writes formulas: text that looks like one stays text", () => {
    expect(sheet).not.toContain("<f>");
    expect(sheet).toContain(`<c r="B3" s="3" t="inlineStr"><is><t xml:space="preserve">=HYPERLINK(&quot;x&quot;)</t></is></c>`);
  });
  it("styles the header, bands rows, freezes the header and adds filters", () => {
    expect(sheet).toContain(`<c r="A1" s="1" t="inlineStr">`);
    expect(sheet).toMatch(/<c r="A2" s="6"><v>[\d.]+<\/v><\/c>/); // date-time
    expect(sheet).toMatch(/<c r="A3" s="7"><v>[\d.]+<\/v><\/c>/); // banded date-time
    expect(sheet).toContain(`state="frozen"`);
    expect(sheet).toContain(`<autoFilter ref="A1:D3"/>`);
    expect(sheet).not.toContain(`r="C3"`); // empty cells are omitted
  });
});
