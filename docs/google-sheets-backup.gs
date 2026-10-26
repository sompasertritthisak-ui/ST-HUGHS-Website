/**
 * St Hugh's College Vientiane — enquiry backup to Google Sheets.
 *
 * Where: in the backup spreadsheet, Extensions → Apps Script. Replace everything in Code.gs with this file.
 * Then: set SECRET below, Deploy → New deployment → type "Web app", Execute as "Me", Who has access "Anyone",
 * Deploy, and authorise. Put the web app URL (ends in /exec) in Railway as SHEETS_WEBHOOK_URL and the same SECRET as
 * SHEETS_WEBHOOK_SECRET. Full steps: docs/GOOGLE_SHEETS_BACKUP.md.
 * Updating this script later: Deploy → Manage deployments → ✎ → Version "New version" → Deploy (the URL stays the same).
 *
 * What it does: the website POSTs enquiries here; each one is written to the "Enquiries" tab, matched by Enquiry ID
 * (a new enquiry adds a row, a status/assignee change updates its row). Columns you add yourself are never touched.
 * The tab is styled in St Hugh's colours (deep blue, red, white) automatically; menu "St Hugh's → Apply styling"
 * re-applies it at any time.
 */

const SECRET = "PASTE-A-LONG-RANDOM-PHRASE-HERE"; // the same phrase as SHEETS_WEBHOOK_SECRET in Railway
const SHEET_NAME = "Enquiries";

// St Hugh's palette (the website's brand tokens)
const BRAND = {
  blue: "#103090", // wordmark blue — header row
  midnight: "#0B1350", // text
  red: "#CF1B18", // route line — header underline, tab colour
  band: "#F5F7FC", // alternate rows
  line: "#D9DFEE",
  font: "Plus Jakarta Sans", // the website's text font (Sheets falls back to its default if unavailable)
};

// Status colours (background, text) — red = needs attention, blue = in progress, green = good, grey = closed
const STATUS_COLOURS = {
  "New": ["#FDE8E7", "#A3120F"],
  "Contacted": ["#E8EDFB", "#103090"],
  "Consultation booked": ["#DCE4FA", "#0B1350"],
  "Qualified": ["#E6F4EA", "#1E6B3A"],
  "Application started": ["#E6F4EA", "#1E6B3A"],
  "Application submitted": ["#D3EEDB", "#14532D"],
  "Converted": ["#1E6B3A", "#FFFFFF"],
  "Not proceeding": ["#F1F2F5", "#6B7280"],
  "Archived": ["#F1F2F5", "#9CA3AF"],
};
const TYPE_COLOURS = {
  "Consultation": ["#FFF4D6", "#8A5A00"],
  "Campus tour": ["#E8EDFB", "#103090"],
  "Brochure request": ["#F1F2F5", "#374151"],
};
// Column widths in pixels, by header
const WIDTHS = {
  "Enquiry ID": 120, "Received (Laos time)": 150, "Type": 130, "Status": 175, "Name": 180, "Email": 230, "Phone": 160,
  "Country": 110, "I am a": 100, "Current qualification": 180, "Programme": 230, "Destination": 130, "Message": 360,
  "Consultation date": 130, "Consultation time": 120, "Consultation mode": 140, "Assigned to": 150, "Follow-up": 150,
  "Source page": 160, "UTM source": 110, "UTM medium": 110, "UTM campaign": 130, "Marketing consent": 130,
  "Last updated (Laos time)": 170,
};

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: "bad-json" });
  }
  // Spaces around either phrase (easy to paste by accident) are ignored.
  const secret = String(SECRET || "").trim();
  if (!secret || secret.indexOf("PASTE-") === 0) return reply({ ok: false, error: "secret-not-set" });
  if (String(body.secret || "").trim() !== secret) return reply({ ok: false, error: "unauthorised" });

  const columns = body.columns || [];
  const rows = body.rows || [];
  const lock = LockService.getScriptLock();
  lock.waitLock(30000); // two enquiries arriving together never write the same row
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // Header row: create it, or add any new website columns at the end (existing columns and their order are kept).
    let headers = sheet.getLastColumn() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String) : [];
    if (headers.every(function (h) { return !h; })) headers = [];
    const before = headers.length;
    columns.forEach(function (c) {
      if (headers.indexOf(c.header) === -1) headers.push(c.header);
    });
    if (headers.length !== before) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      styleSheet(sheet, headers); // first run, or the website added a column
    }

    const keyFor = {};
    columns.forEach(function (c) { keyFor[c.header] = c.key; });
    const idCol = headers.indexOf("Enquiry ID") + 1;
    const last = sheet.getLastRow();
    const ids = last > 1 ? sheet.getRange(2, idCol, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];

    let added = 0;
    let updated = 0;
    rows.forEach(function (row) {
      // null = a column the website does not own (e.g. staff notes): keep whatever is in the sheet
      const values = headers.map(function (h) { return keyFor[h] ? (row[keyFor[h]] == null ? "" : row[keyFor[h]]) : null; });
      const at = ids.indexOf(String(row.id));
      if (at >= 0) {
        const range = sheet.getRange(at + 2, 1, 1, headers.length);
        const existing = range.getValues()[0];
        range.setValues([values.map(function (v, i) { return v === null ? existing[i] : v; })]);
        updated++;
      } else {
        sheet.appendRow(values.map(function (v) { return v === null ? "" : v; }));
        ids.push(String(row.id));
        added++;
      }
    });
    if (added) styleRows(sheet, headers, sheet.getLastRow() - added + 1, added);
    return reply({ ok: true, added: added, updated: updated });
  } finally {
    lock.releaseLock();
  }
}

/** St Hugh's look for the whole tab: header, banding, widths, status colours. Safe to run any number of times. */
function styleSheet(sheet, headers) {
  const n = headers.length;
  const maxRows = Math.max(sheet.getMaxRows(), 2);

  sheet.setTabColor(BRAND.red);
  sheet.setFrozenRows(1);
  sheet.setHiddenGridlines(true);

  // Body: font, colour, alignment
  const body = sheet.getRange(2, 1, maxRows - 1, n);
  body.setFontFamily(BRAND.font).setFontSize(10).setFontColor(BRAND.midnight).setVerticalAlignment("middle");

  // Header: deep blue, white bold text, red underline
  const header = sheet.getRange(1, 1, 1, n);
  header
    .setBackground(BRAND.blue)
    .setFontColor("#FFFFFF")
    .setFontFamily(BRAND.font)
    .setFontWeight("bold")
    .setFontSize(10)
    .setVerticalAlignment("middle")
    .setWrap(true)
    .setBorder(null, null, true, null, null, null, BRAND.red, SpreadsheetApp.BorderStyle.SOLID_THICK);
  sheet.setRowHeight(1, 40);

  // Alternate row colours (white / pale blue), replacing any earlier banding
  sheet.getBandings().forEach(function (b) { b.remove(); });
  sheet
    .getRange(1, 1, maxRows, n)
    .applyRowBanding(SpreadsheetApp.BandingTheme.BLUE, true, false)
    .setHeaderRowColor(BRAND.blue)
    .setFirstRowColor("#FFFFFF")
    .setSecondRowColor(BRAND.band);

  // Column widths, wrapped messages, plain-text IDs and phones
  headers.forEach(function (h, i) {
    if (WIDTHS[h]) sheet.setColumnWidth(i + 1, WIDTHS[h]);
    const col = sheet.getRange(2, i + 1, maxRows - 1, 1);
    if (h === "Message" || h === "Current qualification") col.setWrap(true).setVerticalAlignment("top");
    if (h === "Enquiry ID" || h === "Phone") col.setNumberFormat("@");
    if (h === "Status" || h === "Type" || h === "Marketing consent") col.setHorizontalAlignment("center").setFontWeight("bold");
  });

  // Status and type colours (conditional rules follow the rows when you sort or filter)
  const rules = [];
  const add = function (header, map) {
    const at = headers.indexOf(header);
    if (at === -1) return;
    const range = sheet.getRange(2, at + 1, maxRows - 1, 1);
    Object.keys(map).forEach(function (value) {
      rules.push(
        SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(value).setBackground(map[value][0]).setFontColor(map[value][1]).setRanges([range]).build(),
      );
    });
  };
  add("Status", STATUS_COLOURS);
  add("Type", TYPE_COLOURS);
  sheet.setConditionalFormatRules(rules);

  // A note on the Status header: the sheet is a backup, edits belong in the CMS
  const statusAt = headers.indexOf("Status");
  if (statusAt !== -1) sheet.getRange(1, statusAt + 1).setNote("Change the status in the CMS (Enquiries). The website updates this column; edits made here are overwritten on the next sync.");
}

/** New rows: comfortable height. (Colours, fonts and banding already cover the whole tab.) */
function styleRows(sheet, headers, fromRow, count) {
  if (count > 0) sheet.setRowHeights(fromRow, count, 30);
}

/** Spreadsheet menu: St Hugh's → Apply styling. */
function onOpen() {
  SpreadsheetApp.getUi().createMenu("St Hugh's").addItem("Apply styling", "applyStyling").addToUi();
}

function applyStyling() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastColumn() === 0) {
    SpreadsheetApp.getUi().alert("The Enquiries tab appears after the first sync from the CMS (Settings → Integrations → Sync all enquiries now).");
    return;
  }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  styleSheet(sheet, headers);
  if (sheet.getLastRow() > 1) styleRows(sheet, headers, 2, sheet.getLastRow() - 1);
}

/** Opening the web app URL in a browser shows this — a quick way to check the deployment works. */
function doGet() {
  return reply({ ok: true, service: "shv-enquiry-backup" });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
