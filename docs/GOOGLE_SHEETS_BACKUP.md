# Google Sheets backup of enquiries

Every enquiry and consultation booking is copied to a Google Sheet, in addition to the CMS database:

- **New enquiries** are added as soon as they are submitted (after the visitor's confirmation, so the form is never slowed down).
- **Changes in the CMS** — status, assigned counsellor, follow-up date — update that enquiry's row.
- **CMS → Settings → Integrations → "Sync all enquiries now"** copies everything already in the database (use it once after setup, or any time to refresh the whole sheet).

Rows are matched by **Enquiry ID**, so nothing is ever duplicated. Columns you add to the sheet yourself (for example your own notes) are never overwritten. Text that looks like a spreadsheet formula is stored as plain text, so a form entry can never run a formula in the sheet. If Google is unreachable the enquiry is still saved in the CMS; run "Sync all enquiries now" later to catch up.

The sheet holds personal data (names, emails, phones). Keep it shared only with the admissions team.

## One-time setup (about 10 minutes)

1. Open the backup spreadsheet in Google Sheets (signed in as its owner).
2. **Extensions → Apps Script**. Delete everything in `Code.gs` and paste the contents of [`docs/google-sheets-backup.gs`](./google-sheets-backup.gs).
3. On the `SECRET` line, replace `PASTE-A-LONG-RANDOM-PHRASE-HERE` with a long random phrase only you know (for example four or five unrelated words and some numbers). Click **Save**.
4. **Deploy → New deployment**. Click the gear next to "Select type" and choose **Web app**.
   - Description: `Enquiry backup`
   - Execute as: **Me**
   - Who has access: **Anyone** (the website is not signed in to Google; the SECRET is what protects it)
5. Click **Deploy**, then **Authorize access** and allow it (Google warns that the app is unverified because it is your own script — choose *Advanced → Go to … (unsafe)* to continue; it only touches this spreadsheet).
6. Copy the **Web app URL** (it ends in `/exec`). Opening it in a browser should show `{"ok":true,"service":"shv-enquiry-backup"}`.
7. In **Railway → the ST-HUGHS-Website service → Variables**, add:
   - `SHEETS_WEBHOOK_URL` = the web app URL
   - `SHEETS_WEBHOOK_SECRET` = exactly the same phrase as `SECRET` in the script

   Railway redeploys automatically.
8. In the CMS: **Settings → Integrations** shows both as *configured*. Click **Sync all enquiries now** to copy the existing enquiries. A new tab called **Enquiries** appears in the spreadsheet.

## If something goes wrong

| What the CMS says | Fix |
| --- | --- |
| "not set up yet" | One of the two Railway variables is missing. |
| "rejected the secret" | `SHEETS_WEBHOOK_SECRET` and `SECRET` in the script are not identical. |
| "could not be updated (http-…)" or no rows appear | The deployment's access is not "Anyone", or the URL is not the `/exec` one. Redeploy: Deploy → Manage deployments → edit → New version. |

**Changing the script later:** after editing it, use *Deploy → Manage deployments → ✎ → Version: New version → Deploy*, so the same URL keeps working.

Code: `src/lib/sheets.ts` (columns, formatting, sync), `src/lib/admin-ops/sheets-actions.ts` (the button), called from `src/app/api/_lib/lead.ts` and `src/lib/admin-ops/enquiries-actions.ts`.
