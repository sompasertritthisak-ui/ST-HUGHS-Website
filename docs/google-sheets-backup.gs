/**
 * St Hugh's College Vientiane — enquiry backup to Google Sheets.
 *
 * Where: in the backup spreadsheet, Extensions → Apps Script. Replace everything in Code.gs with this file.
 * Then: set SECRET below, Deploy → New deployment → type "Web app", Execute as "Me", Who has access "Anyone",
 * Deploy, and authorise. Put the web app URL (ends in /exec) in Railway as SHEETS_WEBHOOK_URL and the same SECRET as
 * SHEETS_WEBHOOK_SECRET. Full steps: docs/GOOGLE_SHEETS_BACKUP.md.
 *
 * What it does: the website POSTs enquiries here; each one is written to the "Enquiries" tab, matched by Enquiry ID
 * (a new enquiry adds a row, a status/assignee change updates its row). Columns you add yourself are never touched.
 */

const SECRET = "PASTE-A-LONG-RANDOM-PHRASE-HERE"; // the same phrase as SHEETS_WEBHOOK_SECRET in Railway
const SHEET_NAME = "Enquiries";

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: "bad-json" });
  }
  if (!SECRET || SECRET.indexOf("PASTE-") === 0 || body.secret !== SECRET) return reply({ ok: false, error: "unauthorised" });

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
    columns.forEach(function (c) {
      if (headers.indexOf(c.header) === -1) headers.push(c.header);
    });
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sheet.setFrozenRows(1);

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
    return reply({ ok: true, added: added, updated: updated });
  } finally {
    lock.releaseLock();
  }
}

/** Opening the web app URL in a browser shows this — a quick way to check the deployment works. */
function doGet() {
  return reply({ ok: true, service: "shv-enquiry-backup" });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
