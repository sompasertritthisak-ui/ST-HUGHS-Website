# SHV CMS — Staff guide

The CMS lives at `/admin`. It is a working tool for keeping the public site accurate: every
programme, pathway, university, partner, story, article and document on the website comes from
here. Nothing is hardcoded.

## Signing in
1. Go to `/admin/login` and enter your staff email and password.
2. After ten failed attempts from one network the login is paused for 15 minutes.
3. Sessions last 8 hours. Use **Sign out** (top right) on shared machines.
4. Passwords are reset by a super admin under **Users**.

## Roles
| Role | Can |
|---|---|
| Viewer | Read everything in the CMS; change nothing. |
| Editor | Create and edit content, upload media, submit for review. |
| Marketing | Editor rights plus campaigns, analytics, SEO fields. |
| Admissions / counsellor | Enquiry pipeline, analytics; read-only content. |
| Content admin | Everything above plus approve, publish, archive, delete, roll back, navigation, settings. |
| Super admin | Everything, including users. |

The sidebar only shows sections your role can open. Every action is re-checked on the server.

## Workflow
`Draft → In review → Approved → Published → Archived`

- **Draft**: only visible in the CMS.
- **In review**: an editor has submitted it. Content admins see it on the dashboard under *Awaiting approval*.
- **Approved**: checked and ready; still not public.
- **Published**: live on the site (subject to *Publish at*, below).
- **Archived**: removed from the site but kept, with history. Archived items can return to Draft.

Use the **Workflow** panel on the right of any edit page. Only the transitions allowed for your
role and the current status are shown. Publishing and archiving ask you to confirm.

**Student stories** cannot be published until *Consent status* is **Granted**. Withdrawing consent
on a published story is blocked until the story is taken off the site.

## Adding a programme
1. **Programmes → New programme**. Fill in title, type, summary and description. Leave *Slug* blank to generate it.
2. Save. The record is created as a Draft and the **Modules** list appears below the form — add core, subject, skills and English modules and reorder them with the arrows.
3. Complete **Governance**: verification status, source note (where the facts were confirmed), owner, effective and review dates. Only *Verified* facts should be presented as such.
4. Submit for review. A content admin approves and publishes.

## Adding a pathway
1. Create the **Destination** and **University** first if they do not exist.
2. **Pathways → New pathway**. Choose the programme, destination and university; fill in structure (e.g. 1 + 3), duration, transfer point and progression requirements.
3. Save, then add **Steps** in order: label, location, institution, duration, description. Add latitude/longitude where you want the step to appear on the map and globe.
4. Governance and workflow as above. Pathways feed the Pathway Explorer, the comparison tool and the finder.

## Adding a partner or university
Partners (awarding bodies, education and industry partners) and universities carry a
*Verification status*. Anything not yet confirmed shows a "Verification pending" badge on the
public site. Record the source (URL, agreement, date) in *Source note*. Upload the logo in the
media library first and pick it in the form.

## Pages and blocks
Pages are built from ordered blocks (hero, rich text, image, programme grid, pathway timeline,
FAQ, CTA, logo wall…). Save the page first, then use **Blocks** below the form: add a block by
type, edit its fields (or the validated JSON view), toggle visibility, reorder, delete. Block
data is never executed as code. Use slug `home` for the homepage.

## Media and consent
- **Media** accepts JPEG, PNG, WebP, AVIF, MP4 and PDF up to 25 MB. SVG is not accepted.
- Files are stored under a random name; the original name is kept for search.
- Each file has **alt text** (required before it can be *Approved*), caption, credit, tags,
  a **focal point** (click the image), a **usage status** and a **consent status**.
- Photos of students need *Consent granted* before they are used publicly. Story photos and
  the story itself both carry consent.
- A file that is referenced by any content cannot be deleted; remove the references first.

## Documents
Upload the PDF in Media, then create a **Document** with category, version, date and
visibility (*Public* or *Internal*). Publish it to list it under Resources.

## Scheduled publishing
Pages, programmes and news articles have a **Publish at** field. Set a future date and publish:
the item stays hidden on the public site until that time. The dashboard lists scheduled items.
Leaving it blank publishes immediately (the field is filled with the publish time).

## Revisions and rollback
A snapshot is taken before every save, status change, block edit and rollback. Open **Revision
history** from the Record panel to see versions, who made them and a field-by-field comparison
with the current record. Content admins can **Restore** a version; the current state is
snapshotted first and the status is left unchanged.

## Governance dashboard
The dashboard shows counts by status, items awaiting approval, scheduled items and anything
whose **review date** has passed. Time-sensitive facts (partners, progression routes, entry
requirements, fees, deadlines) should always have an owner and a review date.

## Audit
Every create, update, delete, upload, status change, publish, unpublish, rollback and login is
recorded with who, when and the before/after values. Content admins can browse it under
**Audit log**.
