/**
 * Seed — VERIFIED CONTENT ONLY.
 *
 * Sources used (recorded per record in `sourceNote`):
 *  [NCUK-SHV]   https://www.ncuk.ac.uk/where-can-i-study/st-hughs-college-vientiane/
 *  [NCUK-NEWS]  https://www.ncuk.ac.uk/ncuk-updates/ncuk-expands-into-laos-partnering-with-pbis-and-st-hughs-college-vientiane/ (28 Feb 2025)
 *  [NCUK-IFY]   https://www.ncuk.ac.uk/our-qualifications/international-foundation-year/
 *  [NCUK-IY1]   https://www.ncuk.ac.uk/our-qualifications/international-year-one/
 *  [SHV-WEB]    https://www.sthughs.edu.la/
 *  [SHV-REF]    https://st-hughs-study-pathways.dennisppanyathip.chatgpt.site (content reference only)
 *
 * Anything not confirmed by an official source is seeded with
 * verificationStatus = PENDING and, where structure is unconfirmed, status = IN_REVIEW
 * so it is NOT visible on the public site until SHV approves it in the CMS.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PUB = { status: "PUBLISHED" };
const REVIEW = { status: "IN_REVIEW" };

async function main() {
  // ── Users ──────────────────────────────────────────────────────────────────
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@sthughs.edu.la").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "change-me-on-first-login";
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, name: "SHV Super Admin", passwordHash, role: "SUPER_ADMIN" },
  });
  const demoUsers: { email: string; name: string; role: string }[] = [
    { email: "content@sthughs.edu.la", name: "Content Admin", role: "CONTENT_ADMIN" },
    { email: "editor@sthughs.edu.la", name: "Editor", role: "EDITOR" },
    { email: "admissions@sthughs.edu.la", name: "Admissions Counsellor", role: "ADMISSIONS" },
    { email: "marketing@sthughs.edu.la", name: "Marketing", role: "MARKETING" },
  ];
  for (const u of demoUsers) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: { ...u, passwordHash } });
  }

  // ── Site settings ──────────────────────────────────────────────────────────
  await prisma.siteSetting.upsert({
    where: { key: "contact" },
    update: {},
    create: {
      key: "contact",
      valueJson: JSON.stringify({
        institutionName: "St Hugh's College Vientiane",
        shortName: "SHV",
        addressLines: ["Nonsavanh Village", "Saysettha District", "Vientiane Capital", "Lao PDR"],
        phones: ["+856 20 52451711", "+856 20 59965564"],
        emails: [],
        whatsapp: "",
        officeHours: ["Monday – Friday, 8:30 – 17:00 (to be confirmed)"],
        mapLat: 17.9757,
        mapLng: 102.6331,
        social: {
          facebook: "https://www.facebook.com/sthughscollegevientiane",
          linkedin: "https://la.linkedin.com/company/st-hugh-s-college",
          youtube: "https://www.youtube.com/@StHughsCollegeVientiane",
        },
        admissionsContact: "",
        pressContact: "",
      }),
    },
  });
  await prisma.siteSetting.upsert({
    where: { key: "messaging" },
    update: {},
    create: {
      key: "messaging",
      valueJson: JSON.stringify({
        heroLine1: "From Laos.",
        heroLine2: "To the world.",
        heroSupport:
          "International education, university pathways and future-focused programmes designed to help students take their next step with confidence.",
        tagline: "Local start. Global future.",
        finalCtaTitle: "Your next chapter starts here.",
        finalCtaBody:
          "Whether you're planning your first step toward university, exploring an international pathway, or looking for a future beyond borders, St Hugh's College can help you understand the route ahead.",
        guidanceDisclaimer: "This is guidance to help you plan. It is not a formal admissions decision.",
        announcement: "",
      }),
    },
  });
  await prisma.siteSetting.upsert({
    where: { key: "institution" },
    update: {},
    create: {
      key: "institution",
      valueJson: JSON.stringify({
        established: 2023,
        authorisation:
          "St Hugh's College Vientiane received full authorisation from the Lao Ministry of Education and Sports in late 2023 to provide programmes up to Level 5.",
        authorisationSource: "[NCUK-SHV]",
        ncukStudyCentre: true,
        ncukSince: "NCUK partnership announced 28 February 2025; NCUK programmes offered from September 2025.",
        sisterInstitution: "Panyathip British International School (PBIS), Vientiane, established 2001",
        vision: "",
        mission: "",
        governanceNote: "",
      }),
    },
  });

  // ── Navigation ─────────────────────────────────────────────────────────────
  await prisma.navigationItem.deleteMany({});
  const header: [string, string, string?][] = [
    ["About", "/about", "Who we are, our authorisation and our people"],
    ["Programmes", "/programmes", "NCUK International Foundation Year, International Year One and bachelor pathways"],
    ["Pathways", "/pathways", "Routes from Vientiane to universities worldwide"],
    ["Universities", "/universities", "Partner and network universities"],
    ["Destinations", "/destinations", "Where SHV pathways can lead"],
    ["Student life", "/student-life", "Learning, community and campus"],
    ["Admissions", "/admissions", "How to apply, step by step"],
    ["News", "/news", "Announcements and insights"],
  ];
  let order = 0;
  for (const [label, href, description] of header) {
    await prisma.navigationItem.create({ data: { menu: "HEADER", label, href, order: order++, description } });
  }
  const footer: [string, string][] = [
    ["Programmes", "/programmes"],
    ["Pathways", "/pathways"],
    ["Universities", "/universities"],
    ["Destinations", "/destinations"],
    ["Admissions", "/admissions"],
    ["International students", "/international-students"],
    ["Student life", "/student-life"],
    ["Campus", "/campus"],
    ["Careers & employability", "/careers"],
    ["News & insights", "/news"],
    ["Resources", "/resources"],
    ["FAQs", "/faqs"],
    ["Contact", "/contact"],
  ];
  order = 0;
  for (const [label, href] of footer) await prisma.navigationItem.create({ data: { menu: "FOOTER", label, href, order: order++ } });
  const legal: [string, string][] = [
    ["Privacy", "/privacy"],
    ["Cookies", "/cookies"],
    ["Terms", "/terms"],
    ["Accessibility", "/accessibility"],
  ];
  order = 0;
  for (const [label, href] of legal) await prisma.navigationItem.create({ data: { menu: "LEGAL", label, href, order: order++ } });
  const audience: [string, string, string][] = [
    ["I'm a student", "/for/students", "Find the programme and route that fits you"],
    ["I'm a parent", "/for/parents", "Understand the journey, the support and the safeguards"],
    ["I'm a partner", "/for/partners", "Universities and education partners"],
    ["I'm an employer", "/for/employers", "Internships, industry links and graduate talent"],
    ["I'm interested in SHV", "/about", "The institution, its ambition and its people"],
  ];
  order = 0;
  for (const [label, href, description] of audience) await prisma.navigationItem.create({ data: { menu: "AUDIENCE", label, href, order: order++, description } });

  // ── Partners ───────────────────────────────────────────────────────────────
  const partners = [
    {
      slug: "ncuk",
      name: "NCUK",
      type: "AWARDING_BODY",
      website: "https://www.ncuk.ac.uk",
      description:
        "NCUK is a consortium of universities that designs and quality-assures international qualifications delivered at approved Study Centres. St Hugh's College Vientiane is an NCUK Study Centre.",
      featured: true,
      sortOrder: 0,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: "[NCUK-SHV] [NCUK-NEWS]",
    },
    {
      slug: "pbis",
      name: "Panyathip British International School",
      type: "EDUCATION",
      website: "https://www.pbis.edu.la",
      description:
        "Established in Vientiane in 2001 and a member of FOBISIA and COBIS. The founder of St Hugh's College Vientiane is the principal owner of PBIS.",
      featured: true,
      sortOrder: 1,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: "[NCUK-NEWS]",
    },
    {
      slug: "b-you-education-center",
      name: "B-YOU Education Center",
      type: "EDUCATION",
      description: "Chinese language training partner referenced in current SHV materials. Levels, schedules and fees to be confirmed.",
      featured: false,
      sortOrder: 5,
      ...REVIEW,
      verificationStatus: "PENDING",
      sourceNote: "[SHV-REF]",
    },
  ];
  for (const p of partners) await prisma.partner.upsert({ where: { slug: p.slug }, update: p, create: p });

  // ── Destinations (lat/lng = representative capital/major city) ─────────────
  const destinations = [
    { slug: "united-kingdom", country: "United Kingdom", isoCode: "GB", region: "Europe", lat: 51.5074, lng: -0.1278, pathwayTypes: "NCUK IFY, NCUK IYOne", verificationStatus: "VERIFIED", featured: true, sortOrder: 0, summary: "The largest group of NCUK University Partners is in the UK. NCUK International Foundation Year and International Year One students can progress to partner universities across England, Scotland, Wales and Northern Ireland.", progressionNotes: "Progression is to NCUK University Partners and is subject to meeting the published entry requirements of the chosen university and course.", officialLink: "https://www.ncuk.ac.uk/university-partners/" },
    { slug: "australia", country: "Australia", isoCode: "AU", region: "Oceania", lat: -33.8688, lng: 151.2093, pathwayTypes: "NCUK IFY, NCUK IYOne", verificationStatus: "VERIFIED", featured: true, sortOrder: 1, summary: "NCUK University Partners in Australia accept the International Foundation Year and, for some courses, International Year One.", progressionNotes: "Subject to the published requirements of the chosen NCUK University Partner.", officialLink: "https://www.ncuk.ac.uk/university-partners/" },
    { slug: "new-zealand", country: "New Zealand", isoCode: "NZ", region: "Oceania", lat: -36.8485, lng: 174.7633, pathwayTypes: "NCUK IFY, NCUK IYOne", verificationStatus: "VERIFIED", featured: false, sortOrder: 2, summary: "NCUK University Partners in New Zealand accept NCUK qualifications for undergraduate entry.", officialLink: "https://www.ncuk.ac.uk/university-partners/" },
    { slug: "united-states", country: "United States", isoCode: "US", region: "North America", lat: 40.7128, lng: -74.006, pathwayTypes: "NCUK IFY", verificationStatus: "VERIFIED", featured: false, sortOrder: 3, summary: "Selected NCUK University Partners in the USA accept the International Foundation Year.", officialLink: "https://www.ncuk.ac.uk/university-partners/" },
    { slug: "canada", country: "Canada", isoCode: "CA", region: "North America", lat: 43.6532, lng: -79.3832, pathwayTypes: "NCUK IFY", verificationStatus: "VERIFIED", featured: false, sortOrder: 4, summary: "Selected NCUK University Partners in Canada accept the International Foundation Year.", officialLink: "https://www.ncuk.ac.uk/university-partners/" },
    { slug: "france", country: "France", isoCode: "FR", region: "Europe", lat: 45.764, lng: 4.8357, pathwayTypes: "Bachelor pathway (planned)", verificationStatus: "PENDING", featured: false, sortOrder: 5, summary: "Current SHV materials reference a route to ESDES Lyon Business School. Programme structure, entry requirements and progression details are being confirmed.", progressionNotes: "Route details to be confirmed with the partner before publication." },
    { slug: "vietnam", country: "Vietnam", isoCode: "VN", region: "Southeast Asia", lat: 21.0278, lng: 105.8342, pathwayTypes: "Bachelor 2+2 (planned)", verificationStatus: "PENDING", featured: true, sortOrder: 6, summary: "Current SHV materials describe a bachelor route with two years in Laos followed by two years in Vietnam with British University Vietnam. Structure to be formally confirmed.", progressionNotes: "Route details to be confirmed with the partner before publication." },
    { slug: "malaysia", country: "Malaysia", isoCode: "MY", region: "Southeast Asia", lat: 3.139, lng: 101.6869, pathwayTypes: "Bachelor pathway (planned)", verificationStatus: "PENDING", featured: false, sortOrder: 7, summary: "Current SHV materials reference University of Nottingham related progression, including its Malaysia campus. Programme details require formal confirmation.", progressionNotes: "Route details to be confirmed with the partner before publication." },
    { slug: "thailand", country: "Thailand", isoCode: "TH", region: "Southeast Asia", lat: 13.7563, lng: 100.5018, pathwayTypes: "Bachelor 1+2+1 (planned)", verificationStatus: "PENDING", featured: false, sortOrder: 8, summary: "Current SHV materials describe a 1+2+1 route from Laos to Thailand with Assumption University. Structure to be formally confirmed.", progressionNotes: "Route details to be confirmed with the partner before publication." },
  ];
  const destBySlug: Record<string, string> = {};
  for (const d of destinations) {
    const row = await prisma.destination.upsert({
      where: { slug: d.slug },
      update: { ...d, ...PUB, sourceNote: d.verificationStatus === "VERIFIED" ? "[NCUK-IFY] [NCUK-IY1]" : "[SHV-REF] [SHV-WEB]" },
      create: { ...d, ...PUB, sourceNote: d.verificationStatus === "VERIFIED" ? "[NCUK-IFY] [NCUK-IY1]" : "[SHV-REF] [SHV-WEB]" },
    });
    destBySlug[d.slug] = row.id;
  }

  // ── Universities (network summary + named institutions in SHV materials) ───
  const universities = [
    {
      slug: "ncuk-university-partners",
      name: "NCUK University Partners (network)",
      city: "Worldwide",
      destinationId: destBySlug["united-kingdom"],
      website: "https://www.ncuk.ac.uk/university-partners/",
      partnershipType: "NCUK_NETWORK",
      summary:
        "NCUK describes a network of 80+ University Partners in the UK, Australia, New Zealand, USA, Canada and other locations, offering 6,000+ degree courses. Students completing an NCUK qualification at SHV apply to these universities through NCUK.",
      progressionInfo: "NCUK states: \"Guaranteed* entry to one of 80+ NCUK University Partners worldwide\" for International Foundation Year students (*conditions apply; see NCUK).",
      transferPoint: "Year 1 (after IFY) or Year 2 (after International Year One)",
      featured: true,
      sortOrder: 0,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: "[NCUK-IFY] [NCUK-IY1]",
    },
    {
      slug: "british-university-vietnam",
      name: "British University Vietnam",
      city: "Hanoi",
      destinationId: destBySlug["vietnam"],
      website: "https://www.buv.edu.vn",
      partnershipType: "PLANNED",
      summary: "Referenced in current SHV materials as the destination for a bachelor route with two years in Laos and two years in Vietnam.",
      transferPoint: "After Year 2 (planned)",
      featured: true,
      sortOrder: 1,
      ...PUB,
      verificationStatus: "PENDING",
      sourceNote: "[SHV-WEB] [SHV-REF] — partnership and structure to be formally confirmed",
    },
    {
      slug: "assumption-university",
      name: "Assumption University",
      city: "Bangkok",
      destinationId: destBySlug["thailand"],
      website: "https://www.au.edu",
      partnershipType: "PLANNED",
      summary: "Referenced in current SHV materials as the destination for a 1+2+1 route from Laos to Thailand.",
      transferPoint: "After Year 1 (planned)",
      featured: false,
      sortOrder: 2,
      ...PUB,
      verificationStatus: "PENDING",
      sourceNote: "[SHV-REF] — partnership and structure to be formally confirmed",
    },
    {
      slug: "esdes-lyon-business-school",
      name: "ESDES Lyon Business School",
      city: "Lyon",
      destinationId: destBySlug["france"],
      website: "https://www.esdes.fr",
      partnershipType: "PLANNED",
      summary: "Referenced in current SHV materials. Programme structure, entry requirements and progression details to be added once confirmed.",
      featured: false,
      sortOrder: 3,
      ...PUB,
      verificationStatus: "PENDING",
      sourceNote: "[SHV-REF]",
    },
    {
      slug: "university-of-nottingham",
      name: "University of Nottingham",
      city: "Nottingham / Semenyih / Ningbo",
      destinationId: destBySlug["malaysia"],
      website: "https://www.nottingham.ac.uk",
      partnershipType: "PLANNED",
      summary: "Referenced in current SHV materials in relation to international progression across its UK, Malaysia and China campuses. Programme details require formal confirmation.",
      featured: false,
      sortOrder: 4,
      ...PUB,
      verificationStatus: "PENDING",
      sourceNote: "[SHV-REF]",
    },
  ];
  const uniBySlug: Record<string, string> = {};
  for (const u of universities) {
    const row = await prisma.university.upsert({ where: { slug: u.slug }, update: u, create: u });
    uniBySlug[u.slug] = row.id;
  }

  // ── Programmes ─────────────────────────────────────────────────────────────
  const ify = await prisma.programme.upsert({
    where: { slug: "ncuk-international-foundation-year" },
    update: {},
    create: {
      slug: "ncuk-international-foundation-year",
      code: "NCUK-IFY",
      title: "NCUK International Foundation Year",
      shortTitle: "International Foundation Year",
      type: "FOUNDATION",
      awardingBody: "NCUK",
      level: "Pre-university foundation",
      summary:
        "A pre-university programme that prepares students for first-year entry to NCUK University Partners worldwide, combining English for Academic Purposes with three academic subject modules and Skills for Success.",
      description: `## What it is

The NCUK International Foundation Year (IFY) is a pre-university foundation programme designed to prepare international students for first-year undergraduate entry at NCUK University Partners worldwide. At St Hugh's College Vientiane it is delivered in Vientiane, so students complete their foundation year close to home before progressing abroad.

## How the year is structured

Students complete four components:

- **English for Academic Purposes (EAP)** — academic English accepted by NCUK University Partners in place of IELTS for progression.
- **Three academic subject modules** — chosen from the subject modules offered at the Study Centre.
- **Skills for Success** — a fully online module developing independent study and research skills.

## Subject modules

NCUK lists the following IFY subject modules across its network: Art & Design, Biology, Business Studies, Chemistry, Computer Science, Economics, Further Maths, Global Studies, Integrated Maths, Physics, Sociology and Technical Maths. The specific modules offered at SHV are confirmed each intake.

## Assessment and qualification

Assessment combines coursework and examinations set and quality-assured by NCUK. On completion students receive an NCUK certificate confirming successful completion of the programme and a transcript detailing module results.

## Progression

NCUK states that IFY students have "Guaranteed* entry to one of 80+ NCUK University Partners worldwide" (*subject to NCUK's conditions). Students apply to universities through NCUK's dedicated support, and progression depends on meeting the published entry grades of the chosen course.`,
      whoFor:
        "Students who have completed high school and want a structured, internationally recognised route into a bachelor's degree abroad, starting in Vientiane.",
      durationLabel: "Typically 9 months (per NCUK); SHV timetable confirmed each intake",
      durationMonths: 9,
      intakesJson: JSON.stringify(["September"]),
      subjectRoutesJson: JSON.stringify(["Business", "Science & Engineering", "Humanities & Social Sciences"]),
      entryRequirements:
        "Completion of high school. NCUK's typical requirement is IGCSE / O Level / GCSE with four modules at grade 4 or above (usually including English and Maths), or equivalent. SHV confirms equivalencies for Lao and regional qualifications during consultation.",
      englishRequirement: "IELTS 5.0 level or equivalent prior to entry (per NCUK).",
      assessment: "Coursework and examinations set and quality-assured by NCUK.",
      qualification: "NCUK International Foundation Year certificate and transcript.",
      progression: "First-year entry to NCUK University Partners in the UK, Australia, New Zealand, USA, Canada and other locations, subject to course requirements.",
      whatNext: "Apply to NCUK University Partners with NCUK's university placement support, then begin Year 1 of a bachelor's degree.",
      applicationNotes: "Book a free consultation to check your qualifications and English level against the entry requirements.",
      featured: true,
      sortOrder: 0,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: "[NCUK-IFY] [NCUK-SHV] — SHV-specific module list and timetable are CMS fields to be confirmed each intake",
      ownerId: admin.id,
      effectiveDate: new Date("2025-09-01"),
      reviewDate: new Date("2026-12-01"),
      seoTitle: "NCUK International Foundation Year in Vientiane",
      seoDescription: "Study the NCUK International Foundation Year at St Hugh's College Vientiane and progress to NCUK University Partners worldwide.",
      modules: {
        create: [
          { title: "English for Academic Purposes", kind: "ENGLISH", order: 0, description: "Academic English accepted by NCUK University Partners in lieu of IELTS for progression." },
          { title: "Academic subject module 1", kind: "SUBJECT", order: 1, description: "Chosen from the subject modules offered at SHV for the intake." },
          { title: "Academic subject module 2", kind: "SUBJECT", order: 2 },
          { title: "Academic subject module 3", kind: "SUBJECT", order: 3 },
          { title: "Skills for Success", kind: "SKILLS", order: 4, description: "Fully online module developing independent study, research and academic skills." },
        ],
      },
    },
  });

  const iy1 = await prisma.programme.upsert({
    where: { slug: "ncuk-international-year-one-business-management" },
    update: {},
    create: {
      slug: "ncuk-international-year-one-business-management",
      code: "NCUK-IY1-BM",
      title: "NCUK International Year One in Business Management",
      shortTitle: "International Year One — Business Management",
      type: "YEAR_ONE",
      awardingBody: "NCUK",
      level: "Equivalent to the first year of an undergraduate degree",
      summary:
        "A credit-bearing programme equivalent to the first year of a university degree, delivered in Vientiane, with guaranteed progression to Year 2 at NCUK University Partners for students who meet the requirements.",
      description: `## What it is

The NCUK International Year One (IYOne) lets students study the first year of an undergraduate degree at an NCUK Study Centre and progress directly into Year 2 of a degree at an NCUK University Partner. NCUK describes it as "a credit-bearing programme equivalent to the first year of a university undergraduate degree". The final degree certificate is the same as for students who studied all years at the university.

St Hugh's College Vientiane offers the **Business Management** route from September 2025.

## What you study

Business Management modules at first-year undergraduate level, alongside an English for Academic Purposes module that improves academic English and is accepted by universities in lieu of IELTS.

## Progression

Students who successfully complete the programme receive guaranteed entry to Year 2 at NCUK University Partners (subject to NCUK's conditions), with 300+ degree courses across 30+ universities in the UK, Australia and New Zealand available for progression.`,
      whoFor:
        "Students who have completed the NCUK International Foundation Year, A Levels, the International Baccalaureate or an equivalent qualification and want to start their degree at home before transferring into Year 2 abroad.",
      durationLabel: "One academic year",
      durationMonths: 9,
      intakesJson: JSON.stringify(["September"]),
      subjectRoutesJson: JSON.stringify(["Business Management"]),
      entryRequirements:
        "Per NCUK: 48 points with 2 × D grades from the NCUK International Foundation Year; or 2 × D grades at A Level; or 24+ points on the International Baccalaureate; or GPA 2.0 from a US high school diploma; or equivalent.",
      englishRequirement: "IELTS 5.5 level or equivalent prior to entry (per NCUK).",
      assessment: "Coursework and examinations set and quality-assured by NCUK.",
      qualification: "NCUK International Year One certificate and transcript (credit-bearing, first-year equivalent).",
      progression: "Direct entry to Year 2 of a business-related degree at NCUK University Partners in the UK, Australia and New Zealand, subject to course requirements.",
      whatNext: "Progress to Year 2 at an NCUK University Partner and complete the degree abroad.",
      applicationNotes: "Book a free consultation to check your qualifications against the entry requirements.",
      featured: true,
      sortOrder: 1,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: "[NCUK-IY1] [NCUK-SHV] [NCUK-NEWS]",
      ownerId: admin.id,
      effectiveDate: new Date("2025-09-01"),
      reviewDate: new Date("2026-12-01"),
      seoTitle: "NCUK International Year One in Business Management, Vientiane",
      seoDescription: "Start your business degree in Vientiane with the NCUK International Year One and progress to Year 2 at NCUK University Partners.",
      modules: {
        create: [
          { title: "English for Academic Purposes", kind: "ENGLISH", order: 0 },
          { title: "Business Management core modules", kind: "CORE", order: 1, description: "First-year undergraduate level modules set by NCUK. Module titles for the SHV intake are confirmed by the academic team." },
        ],
      },
    },
  });

  // Bachelor routes listed on sthughs.edu.la — kept IN_REVIEW until structures are formally confirmed.
  const bachelorRoutes = [
    {
      slug: "bachelor-pathway-1-plus-3",
      code: "SHV-BA-1+3",
      title: "Bachelor pathway (1+3)",
      shortTitle: "Bachelor 1+3",
      summary: "First year in Laos, final three years abroad. Listed on the current SHV website; partner and structure to be confirmed before publication.",
      durationLabel: "4 years (1 in Vientiane + 3 abroad)",
      durationMonths: 48,
      sortOrder: 10,
    },
    {
      slug: "bachelor-pathway-2-plus-2-vietnam",
      code: "SHV-BA-2+2",
      title: "Bachelor pathway (2+2) — Vietnam",
      shortTitle: "Bachelor 2+2",
      summary: "Two years in Laos, two years in Vietnam. Listed on the current SHV website; partner and structure to be confirmed before publication.",
      durationLabel: "4 years (2 in Vientiane + 2 in Vietnam)",
      durationMonths: 48,
      sortOrder: 11,
    },
    {
      slug: "bachelor-international-hospitality-management",
      code: "SHV-BA-IHM",
      title: "Bachelor in International Hospitality Management (pathway)",
      shortTitle: "International Hospitality Management",
      summary: "Listed on the current SHV website. Awarding partner, structure and entry requirements to be confirmed before publication.",
      sortOrder: 12,
    },
    {
      slug: "bachelor-finance-economics",
      code: "SHV-BA-FE",
      title: "Bachelor in Finance & Economics (pathway)",
      shortTitle: "Finance & Economics",
      summary: "Listed on the current SHV website. Awarding partner, structure and entry requirements to be confirmed before publication.",
      sortOrder: 13,
    },
  ];
  for (const r of bachelorRoutes) {
    await prisma.programme.upsert({
      where: { slug: r.slug },
      update: {},
      create: { ...r, type: "BACHELOR_PATHWAY", ...REVIEW, verificationStatus: "PENDING", sourceNote: "[SHV-WEB] — do not publish until the partner confirms the structure", ownerId: admin.id },
    });
  }

  // ── Pathways ───────────────────────────────────────────────────────────────
  await prisma.pathwayStep.deleteMany({});
  await prisma.pathway.deleteMany({});
  const ncukNet = uniBySlug["ncuk-university-partners"];
  const vte = { lat: 17.9757, lng: 102.6331 };
  const pathways = [
    {
      slug: "ify-business-united-kingdom",
      code: "IFY-BUS-GB",
      title: "Foundation Year → Business degree in the UK",
      summary: "Complete the NCUK International Foundation Year in Vientiane, then progress to Year 1 of a business-related degree at an NCUK University Partner in the UK.",
      programmeId: ify.id,
      subjectArea: "Business",
      destinationId: destBySlug["united-kingdom"],
      universityId: ncukNet,
      partnerName: "NCUK University Partners",
      qualification: "Bachelor's degree (UK)",
      field: "Business, Management, Accounting, Economics",
      structureLabel: "1 + 3",
      totalDurationLabel: "About 4 years",
      transferPoint: "After the Foundation Year → Year 1",
      progressionRequirements: "Meet the IFY grade and EAP requirements published for the chosen course.",
      careerDirections: "Management, finance, marketing, consulting, entrepreneurship",
      featured: true,
      sortOrder: 0,
      verificationStatus: "VERIFIED",
      steps: [
        { label: "Foundation", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "1 year", description: "NCUK International Foundation Year — Business route", ...vte },
        { label: "Year 1", location: "United Kingdom", institution: "NCUK University Partner", duration: "1 year", lat: 51.5074, lng: -0.1278 },
        { label: "Year 2", location: "United Kingdom", institution: "NCUK University Partner", duration: "1 year", lat: 51.5074, lng: -0.1278 },
        { label: "Degree", location: "United Kingdom", institution: "NCUK University Partner", duration: "1 year", description: "Bachelor's degree awarded by the university", lat: 51.5074, lng: -0.1278 },
        { label: "Career", location: "Anywhere", description: "Graduate opportunities in business and management" },
      ],
    },
    {
      slug: "ify-science-engineering-australia",
      code: "IFY-SCI-AU",
      title: "Foundation Year → Science or Engineering degree in Australia",
      summary: "Complete the NCUK International Foundation Year in Vientiane with maths and science modules, then progress to an NCUK University Partner in Australia.",
      programmeId: ify.id,
      subjectArea: "Science & Engineering",
      destinationId: destBySlug["australia"],
      universityId: ncukNet,
      partnerName: "NCUK University Partners",
      qualification: "Bachelor's degree (Australia)",
      field: "Engineering, Computer Science, Sciences",
      structureLabel: "1 + 3",
      totalDurationLabel: "About 4 years",
      transferPoint: "After the Foundation Year → Year 1",
      progressionRequirements: "Engineering routes require passed maths and physics modules; meet the grades published for the chosen course.",
      careerDirections: "Engineering, technology, data, research",
      featured: true,
      sortOrder: 1,
      verificationStatus: "VERIFIED",
      steps: [
        { label: "Foundation", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "1 year", ...vte },
        { label: "Year 1", location: "Australia", institution: "NCUK University Partner", duration: "1 year", lat: -33.8688, lng: 151.2093 },
        { label: "Year 2–3", location: "Australia", institution: "NCUK University Partner", duration: "2 years", lat: -33.8688, lng: 151.2093 },
        { label: "Career", location: "Anywhere" },
      ],
    },
    {
      slug: "ify-humanities-new-zealand",
      code: "IFY-HUM-NZ",
      title: "Foundation Year → degree in New Zealand",
      summary: "Complete the NCUK International Foundation Year in Vientiane, then progress to an NCUK University Partner in New Zealand.",
      programmeId: ify.id,
      subjectArea: "Humanities & Social Sciences",
      destinationId: destBySlug["new-zealand"],
      universityId: ncukNet,
      partnerName: "NCUK University Partners",
      qualification: "Bachelor's degree (New Zealand)",
      structureLabel: "1 + 3",
      totalDurationLabel: "About 4 years",
      transferPoint: "After the Foundation Year → Year 1",
      featured: false,
      sortOrder: 2,
      verificationStatus: "VERIFIED",
      steps: [
        { label: "Foundation", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "1 year", ...vte },
        { label: "Degree", location: "New Zealand", institution: "NCUK University Partner", duration: "3 years", lat: -36.8485, lng: 174.7633 },
        { label: "Career", location: "Anywhere" },
      ],
    },
    {
      slug: "ify-north-america",
      code: "IFY-USA-CAN",
      title: "Foundation Year → degree in the USA or Canada",
      summary: "Selected NCUK University Partners in the USA and Canada accept the International Foundation Year for undergraduate entry.",
      programmeId: ify.id,
      subjectArea: "Business",
      destinationId: destBySlug["united-states"],
      universityId: ncukNet,
      partnerName: "NCUK University Partners",
      qualification: "Bachelor's degree (USA / Canada)",
      structureLabel: "1 + 4",
      totalDurationLabel: "About 5 years",
      transferPoint: "After the Foundation Year → Year 1",
      featured: false,
      sortOrder: 3,
      verificationStatus: "VERIFIED",
      steps: [
        { label: "Foundation", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "1 year", ...vte },
        { label: "Degree", location: "USA / Canada", institution: "NCUK University Partner", duration: "4 years", lat: 40.7128, lng: -74.006 },
        { label: "Career", location: "Anywhere" },
      ],
    },
    {
      slug: "iyone-business-management-year-2",
      code: "IY1-BM-Y2",
      title: "International Year One → Year 2 of a Business degree",
      summary: "Study the first year of a business degree in Vientiane with the NCUK International Year One in Business Management, then progress directly to Year 2 at an NCUK University Partner in the UK, Australia or New Zealand.",
      programmeId: iy1.id,
      subjectArea: "Business",
      destinationId: destBySlug["united-kingdom"],
      universityId: ncukNet,
      partnerName: "NCUK University Partners",
      qualification: "Bachelor's degree in a business-related subject",
      field: "Business Management",
      structureLabel: "1 + 2",
      totalDurationLabel: "About 3 years",
      transferPoint: "After International Year One → Year 2",
      progressionRequirements: "Successful completion of the International Year One and the EAP requirement for the chosen course.",
      careerDirections: "Management, operations, marketing, entrepreneurship",
      featured: true,
      sortOrder: 4,
      verificationStatus: "VERIFIED",
      steps: [
        { label: "Year 1", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "1 year", description: "NCUK International Year One — Business Management", ...vte },
        { label: "Year 2", location: "UK / Australia / New Zealand", institution: "NCUK University Partner", duration: "1 year", lat: 51.5074, lng: -0.1278 },
        { label: "Degree", location: "UK / Australia / New Zealand", institution: "NCUK University Partner", duration: "1 year", lat: 51.5074, lng: -0.1278 },
        { label: "Career", location: "Anywhere" },
      ],
    },
    {
      slug: "bachelor-2-plus-2-british-university-vietnam",
      code: "BA-2+2-VN",
      title: "Bachelor 2+2 → British University Vietnam",
      summary: "Two years in Vientiane followed by two years in Vietnam. Listed in current SHV materials; structure to be formally confirmed before publication.",
      subjectArea: "Business",
      destinationId: destBySlug["vietnam"],
      universityId: uniBySlug["british-university-vietnam"],
      partnerName: "British University Vietnam",
      structureLabel: "2 + 2",
      totalDurationLabel: "4 years",
      transferPoint: "After Year 2 (planned)",
      featured: false,
      sortOrder: 10,
      verificationStatus: "PENDING",
      inReview: true,
      steps: [
        { label: "Years 1–2", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "2 years", ...vte },
        { label: "Years 3–4", location: "Hanoi, Vietnam", institution: "British University Vietnam", duration: "2 years", lat: 21.0278, lng: 105.8342 },
        { label: "Career", location: "Anywhere" },
      ],
    },
    {
      slug: "bachelor-1-plus-2-plus-1-assumption-university",
      code: "BA-1+2+1-TH",
      title: "1+2+1 → Assumption University, Thailand",
      summary: "A 1+2+1 route from Laos to Thailand described in current SHV materials; structure to be formally confirmed before publication.",
      destinationId: destBySlug["thailand"],
      universityId: uniBySlug["assumption-university"],
      partnerName: "Assumption University",
      structureLabel: "1 + 2 + 1",
      totalDurationLabel: "4 years",
      featured: false,
      sortOrder: 11,
      verificationStatus: "PENDING",
      inReview: true,
      steps: [
        { label: "Year 1", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "1 year", ...vte },
        { label: "Years 2–3", location: "Bangkok, Thailand", institution: "Assumption University", duration: "2 years", lat: 13.7563, lng: 100.5018 },
        { label: "Year 4", location: "To be confirmed", duration: "1 year" },
      ],
    },
  ];
  for (const p of pathways) {
    const { steps, inReview, ...data } = p as typeof p & { inReview?: boolean };
    await prisma.pathway.create({
      data: {
        ...data,
        status: inReview ? "IN_REVIEW" : "PUBLISHED",
        sourceNote: data.verificationStatus === "VERIFIED" ? "[NCUK-IFY] [NCUK-IY1]" : "[SHV-REF] [SHV-WEB]",
        ownerId: admin.id,
        steps: { create: steps.map((s, i) => ({ ...s, order: i })) },
      },
    });
  }

  // ── Facilities ─────────────────────────────────────────────────────────────
  const facilities = [
    { slug: "campus-entrance", name: "Campus entrance", category: "ARRIVAL", description: "The arrival point to the SHV campus in Nonsavanh Village.", verificationStatus: "PENDING", sortOrder: 0 },
    { slug: "reception", name: "Reception", category: "ARRIVAL", description: "Where students, families and visitors are welcomed.", verificationStatus: "PENDING", sortOrder: 1 },
    { slug: "welcome-hall", name: "Welcome hall", category: "SOCIAL", description: "An open central space for the college community.", verificationStatus: "PENDING", sortOrder: 2 },
    { slug: "classrooms", name: "Classrooms", category: "LEARNING", description: "Nine classrooms for seminar-style teaching.", verificationStatus: "VERIFIED", sortOrder: 3 },
    { slug: "lecture-halls", name: "Lecture halls", category: "LEARNING", description: "Two lecture halls for lectures, workshops and events.", verificationStatus: "VERIFIED", sortOrder: 4 },
    { slug: "smart-classroom", name: "Smart classroom", category: "LEARNING", description: "Modern teaching equipment and adaptable seating.", verificationStatus: "PENDING", sortOrder: 5 },
    { slug: "ict-room", name: "ICT room", category: "LEARNING", description: "Dedicated workstations for research and coursework.", verificationStatus: "VERIFIED", sortOrder: 6 },
    { slug: "library-study-area", name: "Library & study area", category: "STUDY", description: "Quiet study and reference resources.", verificationStatus: "VERIFIED", sortOrder: 7 },
    { slug: "student-cafe", name: "Student café", category: "SOCIAL", description: "A place to meet between classes.", verificationStatus: "PENDING", sortOrder: 8 },
    { slug: "campus-courtyard", name: "Campus courtyard", category: "OUTDOOR", description: "A green, open-air setting at the heart of the campus.", verificationStatus: "PENDING", sortOrder: 9 },
    { slug: "green-campus-grounds", name: "Green campus grounds", category: "OUTDOOR", description: "Landscaped grounds around the buildings.", verificationStatus: "PENDING", sortOrder: 10 },
  ];
  for (const f of facilities) await prisma.facility.upsert({ where: { slug: f.slug }, update: {}, create: { ...f, ...PUB } });

  // ── Leadership (names and roles from official sources; biographies pending) ─
  const leadership = [
    { slug: "david-bant", name: "David Bant", role: "Vice President and General Director", isLeadership: true, sortOrder: 0, biography: "Biography to be supplied by SHV.", department: "Executive" },
    { slug: "michael-anderson", name: "Michael Anderson", role: "Chief Academic Officer", isLeadership: true, sortOrder: 1, biography: "Biography to be supplied by SHV.", department: "Academic" },
  ];
  for (const l of leadership) await prisma.faculty.upsert({ where: { slug: l.slug }, update: {}, create: { ...l, ...PUB } });

  // ── Outcome metrics (structure only; values verified later) ────────────────
  const metrics = [
    ["students_progressed", "Students progressed to university"],
    ["countries_reached", "Countries reached"],
    ["university_destinations", "University destinations"],
    ["programmes_completed", "Programmes completed"],
    ["internships", "Internships"],
    ["employment", "Graduates in employment"],
    ["scholarships", "Scholarships awarded"],
  ] as const;
  let i = 0;
  for (const [key, label] of metrics) {
    await prisma.outcomeMetric.upsert({ where: { key }, update: {}, create: { key, label, sortOrder: i++, ...PUB, verificationStatus: "PENDING" } });
  }

  // ── FAQs ───────────────────────────────────────────────────────────────────
  await prisma.faq.deleteMany({});
  const faqs: [string, string, string, string?][] = [
    ["PROGRAMMES", "What is the NCUK International Foundation Year?", "A pre-university programme delivered at St Hugh's College Vientiane and quality-assured by NCUK. It combines English for Academic Purposes, three academic subject modules and an online Skills for Success module, and prepares students for first-year entry to NCUK University Partners worldwide.", "ncuk-international-foundation-year"],
    ["PROGRAMMES", "What is the NCUK International Year One?", "A credit-bearing programme equivalent to the first year of a university degree. SHV offers the Business Management route. Students who complete it can progress directly into Year 2 at NCUK University Partners.", "ncuk-international-year-one-business-management"],
    ["ENGLISH", "What English level do I need?", "NCUK's published requirement is IELTS 5.0 or equivalent for the International Foundation Year and IELTS 5.5 or equivalent for the International Year One. Both programmes include English for Academic Purposes, which NCUK University Partners accept in place of IELTS for progression."],
    ["PROGRESSION", "Is university progression guaranteed?", "NCUK states that International Foundation Year students have \"Guaranteed* entry to one of 80+ NCUK University Partners worldwide\", and that International Year One students receive guaranteed entry to Year 2 at NCUK University Partners. The asterisk matters: entry depends on meeting the grades and English requirements published for the specific course, and on NCUK's conditions. Our advisors will explain exactly what applies to your chosen route."],
    ["PATHWAYS", "Can I complete a whole bachelor's degree in Laos?", "St Hugh's College Vientiane is authorised by the Lao Ministry of Education and Sports to provide programmes up to Level 5. Bachelor's degrees are completed with partner universities abroad through pathway structures such as 1+3 or 2+2. The exact structure depends on the route you choose."],
    ["ADMISSIONS", "How do I apply?", "Start with a free consultation. An advisor will check your qualifications and English level against the entry requirements, help you choose a route, and guide you through the application step by step."],
    ["ADMISSIONS", "Is the consultation free?", "Yes. There is no consultation fee. You receive programme guidance, an entry-requirement checklist and a clear next-step plan."],
    ["INTERNATIONAL", "Can students from outside Laos study at SHV?", "SHV welcomes enquiries from international students. Visa and residence requirements are set by the Lao authorities, so we link to official sources and help you understand the process rather than offering immigration advice."],
    ["FEES", "How much does it cost?", "Tuition and other fees are confirmed by the admissions team for each intake and shared during your consultation. Published fee documents appear in the Resources section when available."],
    ["CAMPUS", "Where is the campus?", "Nonsavanh Village, Saysettha District, Vientiane Capital, Lao PDR. The campus has nine classrooms, two lecture halls, a library and an ICT room."],
    ["APPLICATIONS", "When are the intakes?", "NCUK programmes at SHV began in September 2025. Intake dates for each programme are confirmed by the admissions team and shown on the programme page."],
  ];
  i = 0;
  for (const [category, question, answer, programmeSlug] of faqs) {
    const programme = programmeSlug ? await prisma.programme.findUnique({ where: { slug: programmeSlug } }) : null;
    await prisma.faq.create({ data: { category, question, answer, programmeId: programme?.id ?? null, sortOrder: i++, ...PUB } });
  }

  // ── News ───────────────────────────────────────────────────────────────────
  await prisma.newsArticle.upsert({
    where: { slug: "ncuk-expands-into-laos-partnering-with-pbis-and-shv" },
    update: {},
    create: {
      slug: "ncuk-expands-into-laos-partnering-with-pbis-and-shv",
      title: "NCUK expands into Laos, partnering with PBIS and St Hugh's College Vientiane",
      excerpt: "NCUK has announced partnerships with Panyathip British International School and St Hugh's College Vientiane, bringing the International Foundation Year and International Year One to Laos from September 2025.",
      body: `On 28 February 2025 NCUK announced its entry into Laos through partnerships with two institutions in Vientiane: Panyathip British International School (PBIS) and St Hugh's College Vientiane (SHV).

PBIS, established in 2001 and a member of FOBISIA and COBIS, will deliver the NCUK International Foundation Year. SHV will offer both the International Foundation Year and the International Year One in Business Management from September 2025.

SHV received full authorisation from the Lao Ministry of Education and Sports in late 2023 to provide programmes up to Level 5.

David Bant, Vice President and General Director at SHV, said: "This partnership opens doors to global opportunities while providing the support and resources needed to excel."

Stuart Smith, CEO at NCUK, said: "Through this collaboration, we're opening new pathways for Laotian students to access world-class universities globally."

Read the full announcement on the [NCUK website](https://www.ncuk.ac.uk/ncuk-updates/ncuk-expands-into-laos-partnering-with-pbis-and-st-hughs-college-vientiane/).`,
      category: "PARTNERSHIPS",
      authorName: "SHV Communications",
      publishedAt: new Date("2025-02-28"),
      relatedProgrammeId: ify.id,
      relatedUniversityId: uniBySlug["ncuk-university-partners"],
      tagsJson: JSON.stringify(["NCUK", "Partnerships", "Laos"]),
      ...PUB,
    },
  });

  // ── Block-based pages ──────────────────────────────────────────────────────
  const pages: { slug: string; title: string; blocks: { type: string; data: Record<string, unknown> }[]; seoDescription: string }[] = [
    {
      slug: "about",
      title: "About St Hugh's College Vientiane",
      seoDescription: "A young, ambitious private college in Vientiane, authorised by the Lao Ministry of Education and Sports and operating as an NCUK Study Centre.",
      blocks: [
        { type: "HERO", data: { eyebrow: "About SHV", title: "New. Confident. International.", lede: "St Hugh's College Vientiane was established in 2023 as a private institution dedicated to critical thinking, progressive education and a conscientious academic community." } },
        { type: "RICH_TEXT", data: { body: `## Foundation → Pathway → Destination → Future

St Hugh's College Vientiane (SHV) is a young institution with a clear purpose: to give students in Laos a structured, internationally recognised route to university and to careers beyond borders.

SHV received full authorisation from the Lao Ministry of Education and Sports in late 2023 to provide programmes up to Level 5. In February 2025 NCUK announced SHV as an NCUK Study Centre, and from September 2025 the college offers the NCUK International Foundation Year and the International Year One in Business Management.

The founder of SHV is the principal owner of Panyathip British International School (PBIS), established in Vientiane in 2001 and a member of FOBISIA and COBIS. That relationship gives SHV two decades of experience in British-curriculum education in Laos to draw on.

## Governance and leadership

Leadership profiles, vision and mission statements and institutional development plans are maintained by SHV through the content management system and published as they are approved.` } },
        { type: "CTA", data: { title: "Talk to us about the route ahead", body: "Book a free consultation with an advisor.", primaryLabel: "Book a consultation", primaryHref: "/consultation", secondaryLabel: "Explore programmes", secondaryHref: "/programmes" } },
      ],
    },
    {
      slug: "why-st-hughs",
      title: "Why St Hugh's",
      seoDescription: "Why students and families choose St Hugh's College Vientiane: international pathways, academic support and a local start to a global future.",
      blocks: [
        { type: "HERO", data: { eyebrow: "Why St Hugh's", title: "Why Laos. Why SHV. Why global.", lede: "Evidence, not adjectives. Here is what SHV offers and where it can lead." } },
        { type: "RICH_TEXT", data: { body: `## Why Laos

Start close to home. A foundation or first year in Vientiane means lower relocation cost, family proximity and time to build academic English before moving abroad.

## Why SHV

- **International programmes** — NCUK International Foundation Year and International Year One, quality-assured by NCUK.
- **Authorised** — full authorisation from the Lao Ministry of Education and Sports (late 2023) for programmes up to Level 5.
- **Support** — small classes, personalised pathway guidance and English for Academic Purposes built into every programme.
- **Employability focus** — a practical, career-oriented approach to higher education.

## Why global

NCUK qualifications are recognised by NCUK University Partners in the UK, Australia, New Zealand, the USA and Canada. Additional partner routes to Vietnam, Thailand, Malaysia and France are being confirmed and will be published here as they are approved.` } },
        { type: "PROGRAMME_GRID", data: { title: "Programmes", featuredOnly: true } },
        { type: "CTA", data: { title: "See where your route could lead", primaryLabel: "Explore your pathway", primaryHref: "/pathway-explorer", secondaryLabel: "Talk to an advisor", secondaryHref: "/consultation" } },
      ],
    },
    { slug: "privacy", title: "Privacy policy", seoDescription: "How St Hugh's College Vientiane handles personal data.", blocks: [{ type: "RICH_TEXT", data: { body: "## Privacy policy\n\nThis policy is maintained by SHV in the content management system. It should describe what personal data is collected through enquiry and consultation forms, how it is used, how long it is kept, and how to request access or deletion.\n\n_Draft — to be reviewed and approved by SHV before launch._" } }] },
    { slug: "cookies", title: "Cookie policy", seoDescription: "How this website uses cookies and similar technologies.", blocks: [{ type: "RICH_TEXT", data: { body: "## Cookie policy\n\nThis website uses strictly necessary cookies for staff sign-in and first-party, anonymous analytics stored in your browser's session storage. No third-party advertising cookies are set.\n\n_Draft — to be reviewed and approved by SHV before launch._" } }] },
    { slug: "terms", title: "Terms of use", seoDescription: "Terms of use for the St Hugh's College Vientiane website.", blocks: [{ type: "RICH_TEXT", data: { body: "## Terms of use\n\nInformation on this website is provided for guidance. Programme availability, entry requirements, fees and partner arrangements are confirmed in writing by the admissions team.\n\n_Draft — to be reviewed and approved by SHV before launch._" } }] },
    { slug: "accessibility", title: "Accessibility statement", seoDescription: "Our commitment to an accessible website.", blocks: [{ type: "RICH_TEXT", data: { body: "## Accessibility statement\n\nWe aim to meet WCAG 2.2 AA. The site supports keyboard navigation, visible focus, screen readers and reduced-motion preferences. If you find a barrier, contact us and we will fix it.\n\n_Draft — to be reviewed and approved by SHV before launch._" } }] },
  ];
  for (const p of pages) {
    const existing = await prisma.page.findUnique({ where: { slug: p.slug } });
    if (existing) continue;
    await prisma.page.create({
      data: {
        slug: p.slug,
        title: p.title,
        seoDescription: p.seoDescription,
        ...PUB,
        blocks: { create: p.blocks.map((b, idx) => ({ type: b.type, order: idx, dataJson: JSON.stringify(b.data) })) },
      },
    });
  }

  // ── Campaign example (attribution) ────────────────────────────────────────
  await prisma.campaign.upsert({
    where: { utmCampaign: "sept-intake" },
    update: {},
    create: { name: "September intake awareness", utmSource: "facebook", utmMedium: "social", utmCampaign: "sept-intake", landingPage: "/programmes" },
  });

  console.log("Seed complete.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
