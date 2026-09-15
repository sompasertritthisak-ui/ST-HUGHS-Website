# CRM integration — enquiries, webhook and export

St Hugh's College Vientiane stores every lead first-party in the `Enquiry` table (with
`Consultation`, `EnquiryNote`, `Campaign`). Nothing about a lead is ever rendered on a public
route; the only ways out are the admin UI (`/admin/enquiries`), the CSV export and the
optional outbound webhook described here. This document is the contract for connecting a CRM
(HubSpot, Salesforce, Zoho) or a workspace tool (Google Workspace / Microsoft 365 automation).

## 1. The enquiry record

| Field (Prisma) | Type | Notes |
|---|---|---|
| `id` | string (cuid) | Stable external id — store it on the CRM side as the dedupe key. |
| `type` | `ENQUIRY \| CONSULTATION \| BROCHURE \| VISIT` | Which public form was used. |
| `name`, `email`, `phone`, `country` | string | `email` is the natural match key for contacts. |
| `audience` | `STUDENT \| PARENT \| PARTNER \| EMPLOYER \| OTHER` | Labels in `src/lib/enums.ts` (`AUDIENCE_LABELS`). |
| `currentQualification` | string? | Free text from the applicant. |
| `programmeId` → `programme.title` | relation | Programme of interest. |
| `destinationId` → `destination.country` | relation | Destination of interest. |
| `message` | string? | Free text. |
| `source` | string? | Path of the page the form was submitted from. |
| `referrer` | string? | `document.referrer` at submit time. |
| `utmSource`, `utmMedium`, `utmCampaign` | string? | Captured from the landing URL and persisted for the session. |
| `campaignId` → `campaign.name` | relation | Resolved by matching `utmCampaign` to `Campaign.utmCampaign`. |
| `status` | see below | Pipeline stage. |
| `assignedToId` → `assignedTo.name/email` | relation | Counsellor (User with role ADMISSIONS / SUPER_ADMIN / CONTENT_ADMIN). |
| `followUpAt` | datetime? | Next action date. |
| `consentMarketing` | boolean | Explicit opt-in. **Do not** add the contact to marketing lists when false. |
| `createdAt`, `updatedAt` | datetime | ISO 8601 UTC in JSON/CSV. |
| `consultation.*` | `preferredDate`, `preferredTime`, `mode`, `confirmedAt`, `calendarRef` | Present only for consultation requests. |
| `notes[]` | `{ id, authorId, body, createdAt }` | **Private.** Never sent to the webhook; only exported with `includeNotes=1`. |

### Pipeline statuses

`NEW → CONTACTED → CONSULTATION_BOOKED → QUALIFIED → APPLICATION_STARTED → APPLICATION_SUBMITTED → CONVERTED`,
plus terminal `NOT_PROCEEDING` and `ARCHIVED`. Status changes are audited (`AuditLog.action = STATUS_CHANGE`).

## 2. Field mapping

| SHV field | HubSpot (Contact / Deal) | Salesforce (Lead) | Zoho CRM (Lead) |
|---|---|---|---|
| `id` | `shv_enquiry_id` (custom, unique) | `SHV_Enquiry_Id__c` (External ID) | `SHV_Enquiry_ID` (custom, unique) |
| `name` | `firstname` + `lastname` (split on first space) | `FirstName`, `LastName` | `First_Name`, `Last_Name` |
| `email` | `email` | `Email` | `Email` |
| `phone` | `phone` | `Phone` / `MobilePhone` | `Phone` / `Mobile` |
| `country` | `country` | `Country` | `Country` |
| `audience` | `shv_audience` (dropdown) | `SHV_Audience__c` (picklist) | `Audience` (pick list) |
| `type` | `shv_enquiry_type` | `SHV_Enquiry_Type__c` | `Enquiry_Type` |
| `programme.title` | `shv_programme` | `SHV_Programme__c` | `Programme` |
| `destination.country` | `shv_destination` | `SHV_Destination__c` | `Destination` |
| `currentQualification` | `shv_current_qualification` | `SHV_Current_Qualification__c` | `Current_Qualification` |
| `message` | Note / `message` | `Description` | `Description` |
| `status` | Deal `dealstage` (map to a custom pipeline) / `lifecyclestage` | `Status` (custom picklist values) | `Lead_Status` |
| `assignedTo.email` | `hubspot_owner_id` (look up owner by email) | `OwnerId` (look up User by email) | `Owner` (look up by email) |
| `followUpAt` | Task due date | `Follow_Up_Date__c` / Task | `Follow_Up_Date` / Task |
| `consentMarketing` | `hs_legal_basis` + subscription status | `HasOptedOutOfEmail` = !consent | `Email_Opt_Out` = !consent |
| `source` | `hs_analytics_source_data_1` or custom `shv_source_path` | `LeadSource` = "Website", `SHV_Source_Path__c` | `Lead_Source` = "Website", `Source_Path` |
| `referrer` | `hs_analytics_first_referrer` / custom | `SHV_Referrer__c` | `Referrer` |
| `utmSource` / `utmMedium` / `utmCampaign` | `utm_source`, `utm_medium`, `utm_campaign` (custom) | `UTM_Source__c`, `UTM_Medium__c`, `UTM_Campaign__c` | `UTM_Source`, `UTM_Medium`, `UTM_Campaign` |
| `campaign.name` | Marketing campaign association | `Campaign` (CampaignMember) | `Campaign_Name` |
| `consultation.preferredDate` + `preferredTime` | Meeting / custom `shv_consultation_preferred` | Event `ActivityDateTime` | Event / `Consultation_Preferred` |
| `consultation.mode` | `shv_consultation_mode` | `SHV_Consultation_Mode__c` | `Consultation_Mode` |
| `consultation.confirmedAt` | Meeting outcome / custom | `SHV_Consultation_Confirmed__c` | `Consultation_Confirmed` |
| `createdAt` | `createdate` (read-only; store as `shv_created_at`) | `CreatedDate` (read-only; store `SHV_Created_At__c`) | `Created_Time` (read-only; store `SHV_Created_At`) |

Recommended CRM pipeline stages mirror the SHV statuses one-to-one so that a status change on
either side can be reconciled without translation tables.

## 3. Outbound webhook (`CRM_WEBHOOK_URL`)

Implemented in `src/lib/notify.ts` (`forwardToCrm`) and called from the public form handlers
(`src/app/api/_lib/lead.ts`, used by `POST /api/enquiries` and `POST /api/consultations`) after
the response has been sent. It is best-effort: a 5 s timeout, no retries, and failures are
logged as `{"event":"enquiry.crm.failed", id, status|error}` in the server log. No-op when
`CRM_WEBHOOK_URL` is unset. The Integrations tab in `/admin/settings` shows whether the
variable is configured (never the value).

### Request

```
POST {CRM_WEBHOOK_URL}
Content-Type: application/json
X-SHV-Event: enquiry.created
Authorization: Bearer {CRM_API_KEY}     // only when CRM_API_KEY is set
```

### Body — `{ event, sentAt, enquiry }`

`enquiry` is the `EnquiryNotification` type exported from `src/lib/notify.ts`:

```json
{
  "event": "enquiry.created",
  "sentAt": "2026-09-15T08:12:33.000Z",
  "enquiry": {
    "id": "cmf1abc…",
    "type": "CONSULTATION",
    "name": "Souphaphone K.",
    "email": "s.k@example.com",
    "phone": "+856 20 …",
    "country": "Lao PDR",
    "audience": "STUDENT",
    "currentQualification": "Grade 12",
    "programme": { "slug": "ncuk-international-foundation-year", "title": "NCUK International Foundation Year" },
    "destination": { "slug": "united-kingdom", "country": "United Kingdom" },
    "pathwaySlug": null,
    "message": "…",
    "source": "/programmes/ncuk-international-foundation-year",
    "referrer": "https://www.facebook.com/",
    "utmSource": "facebook",
    "utmMedium": "social",
    "utmCampaign": "sept-intake",
    "consentMarketing": true,
    "consultation": { "preferredDate": "2026-09-20", "preferredTime": "Afternoon", "mode": "ONLINE" },
    "createdAt": "2026-09-15T08:12:33.000Z"
  }
}
```

Optional fields are `null` or omitted. `status` is always `NEW` at this point and is therefore
not included; `notes`, `assignedTo` and `followUpAt` are **never** sent.

### Currently emitted events

| Event | When |
|---|---|
| `enquiry.created` | A public enquiry, consultation, brochure or visit form is accepted (after honeypot, rate limit and Zod validation). |

Status changes, assignment and consultation confirmation happen in the CMS
(`src/lib/admin-ops/enquiries-actions.ts`) and are audited but **not yet forwarded**. When they
are, they should reuse the same envelope with `event` = `enquiry.status_changed` (adding
`previousStatus`), `enquiry.assigned` (adding `assignedTo: { name, email }`) and
`consultation.confirmed` (adding `confirmedAt`), and set `X-SHV-Event` accordingly.

### Receiver expectations

- Check the `Authorization` bearer token against `CRM_API_KEY` before trusting the body (the
  webhook is not HMAC-signed today; keep the URL secret and use HTTPS).
- Upsert on `enquiry.id` (custom unique property), then match/merge the contact on `email`.
- Respond `2xx` within 5 s — slower responses are treated as failures and logged; there is no
  automatic retry, so reconcile missed leads with the CSV export (section 4) or the admin list.
- Treat a repeated `enquiry.id` as an idempotent update, not a new lead.

## 4. CSV export

`GET /api/admin/enquiries/export` — requires a signed-in CMS user with the `enquiries.export`
permission (roles: SUPER_ADMIN, ADMISSIONS). Accepts exactly the filters used by
`/admin/enquiries`:

`q, status, type, audience, programmeId, destinationId, assignedToId (or "unassigned"), from, to (YYYY-MM-DD), utmCampaign`

Add `includeNotes=1` to append a `notes` column (private counsellor notes, newline-separated
`[timestamp] body`). Without it, notes are never exported.

Columns (UTF-8 with BOM, RFC 4180 quoting, formula-injection guarded):

`id, created_at, updated_at, type, status, status_label, name, email, phone, country, audience,
audience_label, current_qualification, programme, destination, message, assigned_to, follow_up_at,
consent_marketing, source_path, referrer, utm_source, utm_medium, utm_campaign, campaign,
consultation_preferred_date, consultation_preferred_time, consultation_mode,
consultation_confirmed_at[, notes]`

Every export writes an `AuditLog` row (`action = UPDATE`, `entityType = Enquiry`, `afterJson`
includes `note: "export"`, the row count, filters and whether notes were included). Exports are
capped at 10 000 rows; narrow the date range for larger sets.

## 5. Read API for dashboards

`GET /api/admin/analytics?range=7|30|90` (permission `analytics.read`) returns the KPI tiles,
funnel, top pages/programmes/destinations, campaigns-by-enquiries and sources as JSON — the same
data as `/admin/analytics`. `GET /api/admin/users` (permission `users.read`) lists staff accounts
without password hashes; `POST /api/admin/users` (permission `users.manage`) creates one with the
same privilege-escalation checks as the CMS.

## 6. Privacy rules that apply to any integration

- Only send data for which there is a lawful basis; respect `consentMarketing` for any marketing
  list.
- Never forward `EnquiryNote` bodies or `AuditLog` rows to a third-party CRM.
- Keep `CRM_WEBHOOK_URL`, `CRM_WEBHOOK_SECRET` and CRM API credentials in environment variables —
  never in `SiteSetting` or the repository.
- Deletion requests: mark the enquiry `ARCHIVED`, clear personal fields, and propagate the
  deletion to the CRM using `shv_enquiry_id`.
