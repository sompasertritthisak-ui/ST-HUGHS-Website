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
 *  OFFICIAL SHV PROGRAMME DECKS (2026–27), supplied by SHV in September 2026 — authoritative for
 *  programmes, pathways, partners, fee estimates and contact details. Page numbers are PDF pages.
 *  [DECK 1b. BBA-EI Gen AI (SHV+NUOL) vENG.pdf]   Business Administration — Entrepreneurship & Innovation Gen AI (SHV + NUOL), 17 pp (odd pages are Lao mirrors)
 *  [DECK 2b. Inten Eng Recruit Deck vENG.pdf]     Intensive English Programme, 10 pp
 *  [DECK 3. BUV 2+2 vENG.pdf]                     Bachelor in International Hospitality Management 2+2 with British University Vietnam, 10 pp
 *  [DECK 4b. Assumption 1+3 Master vENG.pdf]       Bachelor's + Master's 1+3 with Assumption University (SIMBA), 10 pp
 *  [DECK 5. ESDES 1+3 vLao-ENG.pdf]                Bachelor in International Business 1+3 with ESDES Business School, Lyon, 15 pp
 *  [DECK 6. IFY (NCUK) vENG.pdf]                   NCUK International Foundation Year — Bachelor's degree Pathway (1+3), 11 pp
 *
 * Fee figures are reproduced exactly as printed in the decks and always carry the decks' own
 * disclaimer. Anything a deck does not state is left empty rather than guessed. Anything not
 * confirmed by an official source is seeded with verificationStatus = PENDING and, where the
 * structure is unconfirmed, status = IN_REVIEW / DRAFT so it is NOT visible on the public site.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const PUB = { status: "PUBLISHED" };
const REVIEW = { status: "IN_REVIEW" };

/** Deck disclaimer wording, attached to every fee figure. */
const FEE_DISCLAIMER = "Estimate for 2026–27; partner fees for illustration only and may change.";

const D = {
  bba: "[DECK 1b. BBA-EI Gen AI (SHV+NUOL) vENG.pdf",
  iep: "[DECK 2b. Inten Eng Recruit Deck vENG.pdf",
  buv: "[DECK 3. BUV 2+2 vENG.pdf",
  au: "[DECK 4b. Assumption 1+3 Master vENG.pdf",
  esdes: "[DECK 5. ESDES 1+3 vLao-ENG.pdf",
  ify: "[DECK 6. IFY (NCUK) vENG.pdf",
} as const;
const deck = (k: keyof typeof D, pages: string) => `${D[k]} ${pages}]`;

/** Real byte size of a file under /public, or 0 (with a warning) if it is missing. */
function publicFileSize(rel: string): number {
  const abs = path.resolve(process.cwd(), "public", rel.replace(/^\//, ""));
  try {
    return fs.statSync(abs).size;
  } catch {
    console.warn(`seed: public file missing — ${abs}`);
    return 0;
  }
}

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
  // Contact details: ESDES deck p15 and BUV deck p9 (poster). The two NCUK-listed numbers are kept as secondary.
  const contact = {
    institutionName: "St Hugh's College Vientiane",
    shortName: "SHV",
    addressLines: ["Nonsavanh Village", "Xaysetha District", "Vientiane Capital", "Lao PDR"],
    phones: ["+856 20 58 814 648", "+856 20 52451711", "+856 20 59965564"],
    emails: ["admissions@sthughs.edu.la"],
    whatsapp: "",
    officeHours: ["Monday – Friday, 8:30 – 17:00 (to be confirmed)"],
    mapLat: 17.9757,
    mapLng: 102.6331,
    social: {
      facebook: "https://www.facebook.com/sthughscollegevientiane",
      linkedin: "https://la.linkedin.com/company/st-hugh-s-college",
      youtube: "https://www.youtube.com/@StHughsCollegeVientiane",
    },
    admissionsContact: "admissions@sthughs.edu.la",
    pressContact: "",
  };
  await prisma.siteSetting.upsert({
    where: { key: "contact" },
    update: { valueJson: JSON.stringify(contact) },
    create: { key: "contact", valueJson: JSON.stringify(contact) },
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
  const institution = {
    established: 2023,
    authorisation:
      "St Hugh's College Vientiane received full authorisation from the Lao Ministry of Education and Sports in late 2023 to provide programmes up to Level 5.",
    authorisationSource: "[NCUK-SHV]",
    ncukStudyCentre: true,
    ncukSince: "NCUK partnership announced 28 February 2025; NCUK programmes offered from September 2025.",
    sisterInstitution: "Panyathip British International School (PBIS), Vientiane, established 2001 — SHV is part of the Panyathip group.",
    partnersNote:
      "SHV's official 2026–27 programme decks confirm direct pathway partnerships with British University Vietnam (2+2 Bachelor in International Hospitality Management, Hanoi), Assumption University of Thailand (1+3 Bachelor's + Master's, SIMBA, Bangkok) and ESDES Business School (1+3 Bachelor in International Business, Lyon, part of UCLY), plus an academic collaboration with the National University of Laos (NUOL) for the Business Administration degree in Entrepreneurship & Innovation Gen AI taught on the SHV campus. As an NCUK Study Centre, SHV's International Foundation Year also progresses to NCUK University Partners in the UK, Australia, New Zealand, the USA, Canada, Malaysia and elsewhere.",
    vision: "",
    mission: "",
    governanceNote: "",
  };
  await prisma.siteSetting.upsert({
    where: { key: "institution" },
    update: { valueJson: JSON.stringify(institution) },
    create: { key: "institution", valueJson: JSON.stringify(institution) },
  });

  // ── Navigation ─────────────────────────────────────────────────────────────
  await prisma.navigationItem.deleteMany({});
  const header: [string, string, string?][] = [
    ["About", "/about", "Who we are, our authorisation and our people"],
    ["Programmes", "/programmes", "NCUK Foundation Year and Year One, bachelor pathways with BUV, Assumption and ESDES, the BBA with NUOL and Intensive English"],
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

  // ── Media (brand logos already in /public/brand, class photo, programme decks) ──
  // Media has no natural unique key, so re-seeding matches on `url`.
  async function upsertMedia(data: {
    kind: string;
    url: string;
    filename: string;
    mimeType: string;
    width?: number;
    height?: number;
    alt: string;
    caption?: string;
    credit?: string;
    usageStatus: string;
    consentStatus: string;
    tags: string[];
  }) {
    const { tags, ...rest } = data;
    const payload = { ...rest, sizeBytes: publicFileSize(data.url), tagsJson: JSON.stringify(tags) };
    const existing = await prisma.media.findFirst({ where: { url: data.url } });
    return existing ? prisma.media.update({ where: { id: existing.id }, data: payload }) : prisma.media.create({ data: payload });
  }

  const logoAssumption = await upsertMedia({
    kind: "LOGO",
    url: "/brand/Assumption_LOGO.png",
    filename: "Assumption_LOGO.png",
    mimeType: "image/png",
    width: 314,
    height: 318,
    alt: "Assumption University of Thailand crest",
    credit: "Assumption University",
    usageStatus: "APPROVED",
    consentStatus: "NOT_REQUIRED",
    tags: ["logo", "partner", "assumption-university"],
  });
  const logoEsdes = await upsertMedia({
    kind: "LOGO",
    url: "/brand/ESDES-LOGO.png",
    filename: "ESDES-LOGO.png",
    mimeType: "image/png",
    width: 400,
    height: 400,
    alt: "ESDES Business School (UCLY, Lyon–Annecy) logo",
    credit: "ESDES Business School",
    usageStatus: "APPROVED",
    consentStatus: "NOT_REQUIRED",
    tags: ["logo", "partner", "esdes"],
  });
  const logoNottingham = await upsertMedia({
    kind: "LOGO",
    url: "/brand/NOTTINGHAM_LOGO.png",
    filename: "NOTTINGHAM_LOGO.png",
    mimeType: "image/jpeg", // JPEG data despite the .png extension
    width: 900,
    height: 900,
    alt: "University of Nottingham logo (UK, China, Malaysia)",
    credit: "University of Nottingham",
    usageStatus: "APPROVED",
    consentStatus: "NOT_REQUIRED",
    tags: ["logo", "university", "nottingham"],
  });
  await upsertMedia({
    kind: "LOGO",
    url: "/brand/Language_Centre_Logo.png",
    filename: "Language_Centre_Logo.png",
    mimeType: "image/png",
    width: 1254,
    height: 1254,
    alt: "St Hugh's College Vientiane Language Centre logo",
    credit: "St Hugh's College Vientiane",
    usageStatus: "APPROVED",
    consentStatus: "NOT_REQUIRED",
    tags: ["logo", "shv", "language-centre", "intensive-english"],
  });
  // Real photographs curated from the official decks (no AI-generated or stock composites).
  // consentStatus PENDING = identifiable students pictured; the CMS records consent before wider use.
  const photoSeeds = [
    { key: "class1", url: "/media/students/Class_1.jpg", width: 2400, height: 1440, alt: "Students in class at St Hugh's College Vientiane", credit: "St Hugh's College Vientiane", consentStatus: "PENDING", tags: ["homepage-life", "students", "classroom"] },
    { key: "teacher", url: "/media/students/shv-classroom-teacher.jpg", width: 800, height: 533, alt: "A lecturer teaching a small class at St Hugh's College Vientiane", credit: "St Hugh's College Vientiane", consentStatus: "PENDING", tags: ["homepage-life", "students", "teaching"] },
    { key: "entrance", url: "/media/campus/shv-campus-entrance.jpg", width: 1280, height: 610, alt: "The entrance of St Hugh's College Vientiane", credit: "St Hugh's College Vientiane", consentStatus: "NOT_REQUIRED", tags: ["homepage-life", "campus", "entrance"] },
    { key: "auSigning", url: "/media/partners/shv-assumption-partnership-signing.jpg", width: 2000, height: 1333, alt: "St Hugh's College Vientiane and Assumption University sign their partnership agreement", credit: "St Hugh's College Vientiane", consentStatus: "NOT_REQUIRED", tags: ["homepage-life", "partners", "assumption"] },
    { key: "auCampus", url: "/media/partners/assumption-university-campus.jpg", width: 960, height: 640, alt: "Students on the Assumption University campus, Bangkok", credit: "Assumption University (via SHV deck)", consentStatus: "NOT_REQUIRED", tags: ["partners", "assumption", "campus"] },
    { key: "buvCampus", url: "/media/partners/british-university-vietnam-campus.jpg", width: 1280, height: 600, alt: "Students at the British University Vietnam campus, Hanoi", credit: "British University Vietnam (via SHV deck)", consentStatus: "NOT_REQUIRED", tags: ["partners", "buv", "campus"] },
    { key: "esdesCampus", url: "/media/partners/esdes-lyon-campus.jpg", width: 800, height: 533, alt: "ESDES Business School campus atrium, Lyon", credit: "ESDES Business School (via SHV deck)", consentStatus: "NOT_REQUIRED", tags: ["partners", "esdes", "campus"] },
    { key: "esdesUcly", url: "/media/partners/esdes-ucly-building.jpg", width: 800, height: 533, alt: "The UCLy library used by ESDES students in Lyon", credit: "ESDES Business School (via SHV deck)", consentStatus: "NOT_REQUIRED", tags: ["partners", "esdes"] },
  ] as const;
  const photo: Record<(typeof photoSeeds)[number]["key"], string> = {} as never;
  for (const ph of photoSeeds) {
    const row = await upsertMedia({
      kind: "IMAGE",
      url: ph.url,
      filename: path.basename(ph.url),
      mimeType: "image/jpeg",
      width: ph.width,
      height: ph.height,
      alt: ph.alt,
      credit: ph.credit,
      usageStatus: "APPROVED",
      consentStatus: ph.consentStatus,
      tags: [...ph.tags],
    });
    photo[ph.key] = row.id;
  }

  const deckMedia = [
    { key: "ify", file: "shv-ncuk-international-foundation-year-1-plus-3-2026-27.pdf", alt: "NCUK International Foundation Year — Bachelor's degree Pathway (1+3) programme deck, 2026–27" },
    { key: "iep", file: "shv-intensive-english-programme-2026-27.pdf", alt: "Intensive English Programme deck, 2026–27" },
    { key: "buv", file: "shv-buv-hospitality-management-2-plus-2-2026-27.pdf", alt: "Bachelor in International Hospitality Management 2+2 with British University Vietnam programme deck, 2026–27" },
    { key: "au", file: "shv-assumption-university-bachelor-master-1-plus-3-2026-27.pdf", alt: "Bachelor's + Master's 1+3 with Assumption University (SIMBA) programme deck, 2026–27" },
    { key: "esdes", file: "shv-esdes-international-business-1-plus-3-2026-27.pdf", alt: "Bachelor in International Business 1+3 with ESDES Business School programme deck, 2026–27" },
    { key: "bba", file: "shv-bba-entrepreneurship-innovation-gen-ai-nuol-2026-27.pdf", alt: "Business Administration — Entrepreneurship & Innovation Gen AI (SHV + NUOL) programme deck, 2026–27" },
  ] as const;
  const deckMediaId: Record<string, string> = {};
  for (const m of deckMedia) {
    const row = await upsertMedia({
      kind: "PDF",
      url: `/documents/${m.file}`,
      filename: m.file,
      mimeType: "application/pdf",
      alt: m.alt,
      credit: "St Hugh's College Vientiane",
      usageStatus: "APPROVED",
      consentStatus: "NOT_REQUIRED",
      tags: ["brochure", "programme-deck", "2026-27"],
    });
    deckMediaId[m.key] = row.id;
  }

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
      sourceNote: `[NCUK-SHV] [NCUK-NEWS] ${deck("ify", "p1-2")}`,
    },
    {
      slug: "pbis",
      name: "Panyathip British International School",
      type: "EDUCATION",
      website: "https://www.pbis.edu.la",
      description:
        "Established in Vientiane in 2001 and a member of FOBISIA and COBIS. The founder of St Hugh's College Vientiane is the principal owner of PBIS; SHV is part of the Panyathip group.",
      featured: true,
      sortOrder: 1,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: `[NCUK-NEWS] ${deck("au", "p4")}`,
    },
    {
      slug: "british-university-vietnam",
      name: "British University Vietnam",
      type: "UNIVERSITY",
      website: "https://www.buv.edu.vn",
      description:
        "Academic partner for the 2+2 Bachelor in International Hospitality Management: two years at SHV, two years at BUV in Hanoi. Described in SHV's deck as a leading British-accredited university in Vietnam with British Quality Assurance accreditation.",
      featured: true,
      sortOrder: 2,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: deck("buv", "p1-3"),
    },
    {
      slug: "assumption-university",
      name: "Assumption University of Thailand",
      type: "UNIVERSITY",
      website: "https://www.au.edu",
      logoMediaId: logoAssumption.id,
      description:
        "Partner for the 1+3 Bachelor's + Master's pathway (SIMBA): one year at SHV, three years at Assumption University in Bangkok, which awards both degrees. One of Thailand's most established private international universities.",
      featured: true,
      sortOrder: 3,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: deck("au", "p1, p4"),
    },
    {
      slug: "esdes-business-school",
      name: "ESDES Business School (UCLY)",
      type: "UNIVERSITY",
      website: "https://www.esdes.fr",
      logoMediaId: logoEsdes.id,
      description:
        "Partner for the 1+3 Bachelor in International Business: the NCUK International Foundation Year at SHV, then three years at ESDES Business School in Lyon, France (part of UCLY, founded 1875, 12,000 students). Taught 100% in English.",
      featured: true,
      sortOrder: 4,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: deck("esdes", "p1-3"),
    },
    {
      slug: "national-university-of-laos",
      name: "National University of Laos (NUOL)",
      type: "UNIVERSITY",
      description:
        "Academic collaboration partner for the Business Administration degree in Entrepreneurship & Innovation Gen AI. The Bachelor's degree is awarded by NUOL and the Year 3 top-up is taught by NUOL professors on the St Hugh's campus.",
      featured: true,
      sortOrder: 5,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: deck("bba", "p1, p4, p6"),
    },
    {
      slug: "cambridge-english",
      name: "Cambridge English",
      type: "EDUCATION",
      website: "https://www.cambridgeenglish.org",
      description:
        "Course-materials partner for the Intensive English Programme: Cambridge English materials selected for each level, individual Cambridge One digital access (practice, audio, video and interactive activities) and teacher monitoring beyond the classroom. SHV prepares students for Cambridge English Qualifications and IELTS.",
      featured: false,
      sortOrder: 6,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: `${deck("iep", "p1, p5, p8, p10")} ${deck("bba", "p8")}`,
    },
    {
      slug: "b-you-education-center",
      name: "B-YOU Education Center",
      type: "EDUCATION",
      description: "Chinese language training partner referenced in earlier SHV materials. Not present in the 2026–27 programme decks; levels, schedules and fees to be confirmed.",
      featured: false,
      sortOrder: 20,
      ...REVIEW,
      verificationStatus: "PENDING",
      sourceNote: "[SHV-REF]",
    },
  ];
  for (const p of partners) await prisma.partner.upsert({ where: { slug: p.slug }, update: p, create: p });

  // ── Destinations (lat/lng = representative capital/major city) ─────────────
  const ncukDestNote = `[NCUK-IFY] [NCUK-IY1] ${deck("ify", "p3")}`;
  const destinations = [
    { slug: "united-kingdom", country: "United Kingdom", isoCode: "GB", region: "Europe", lat: 51.5074, lng: -0.1278, pathwayTypes: "NCUK IFY, NCUK IYOne", verificationStatus: "VERIFIED", featured: true, sortOrder: 0, summary: "The largest group of NCUK University Partners is in the UK. NCUK International Foundation Year and International Year One students can progress to partner universities across England, Scotland, Wales and Northern Ireland; SHV's IFY deck shows more than fifty UK partner logos, including QS World Top 100 universities.", progressionNotes: "Progression is to NCUK University Partners and is subject to meeting the published entry requirements of the chosen university and course.", officialLink: "https://www.ncuk.ac.uk/university-partners/", sourceNote: ncukDestNote },
    { slug: "australia", country: "Australia", isoCode: "AU", region: "Oceania", lat: -33.8688, lng: 151.2093, pathwayTypes: "NCUK IFY, NCUK IYOne", verificationStatus: "VERIFIED", featured: true, sortOrder: 1, summary: "NCUK University Partners in Australia accept the International Foundation Year and, for some courses, International Year One. SHV's IFY deck shows partners including UNSW, RMIT, QUT, Swinburne, the University of Newcastle and the University of Western Australia.", progressionNotes: "Subject to the published requirements of the chosen NCUK University Partner.", officialLink: "https://www.ncuk.ac.uk/university-partners/", sourceNote: ncukDestNote },
    { slug: "new-zealand", country: "New Zealand", isoCode: "NZ", region: "Oceania", lat: -36.8485, lng: 174.7633, pathwayTypes: "NCUK IFY, NCUK IYOne", verificationStatus: "VERIFIED", featured: false, sortOrder: 2, summary: "NCUK University Partners in New Zealand accept NCUK qualifications for undergraduate entry. SHV's IFY deck shows partners including AUT, the University of Canterbury, Lincoln University, Otago, Victoria University of Wellington and Waikato.", officialLink: "https://www.ncuk.ac.uk/university-partners/", sourceNote: ncukDestNote },
    { slug: "united-states", country: "United States", isoCode: "US", region: "North America", lat: 40.7128, lng: -74.006, pathwayTypes: "NCUK IFY", verificationStatus: "VERIFIED", featured: false, sortOrder: 3, summary: "Selected NCUK University Partners in the USA accept the International Foundation Year. SHV's IFY deck shows partners including SUNY Oswego, Drew University, Illinois State, Suffolk University, George Mason and Oregon State.", officialLink: "https://www.ncuk.ac.uk/university-partners/", sourceNote: ncukDestNote },
    { slug: "canada", country: "Canada", isoCode: "CA", region: "North America", lat: 43.6532, lng: -79.3832, pathwayTypes: "NCUK IFY", verificationStatus: "VERIFIED", featured: false, sortOrder: 4, summary: "Selected NCUK University Partners in Canada accept the International Foundation Year. SHV's IFY deck shows partners including the University of Alberta, Brock University, uOttawa, the University of Regina and Toronto Metropolitan University.", officialLink: "https://www.ncuk.ac.uk/university-partners/", sourceNote: ncukDestNote },
    {
      slug: "france",
      country: "France",
      isoCode: "FR",
      region: "Europe",
      lat: 45.764,
      lng: 4.8357,
      pathwayTypes: "NCUK IFY, ESDES 1+3 Bachelor in International Business",
      verificationStatus: "VERIFIED",
      featured: true,
      sortOrder: 5,
      summary:
        "Lyon is presented in SHV's ESDES deck as a welcoming European student city where education, culture and international opportunity come together: a dynamic centre for business, innovation and international education, with thousands of international students and quality of life at a more reasonable cost than Paris. Students in France benefit from paid internships (mandatory compensation for internships longer than two months), the right to work up to 20 hours per week, student health insurance at no cost covering 60% of medical costs, and student discounts on public transport, culture and university restaurants.",
      durationNotes: "1 year in Vientiane (NCUK IFY) + 3 years at ESDES Business School, Lyon.",
      progressionNotes: "Progression to the ESDES Bachelor in International Business after the NCUK International Foundation Year at SHV. France (ESDES) also appears among the NCUK IFY progression destinations.",
      officialLink: "https://www.esdes.fr",
      heroMediaId: photo.esdesCampus,
      sourceNote: `${deck("esdes", "p1-5, p8-9")} ${deck("ify", "p2-3")}`,
    },
    {
      slug: "vietnam",
      country: "Vietnam",
      isoCode: "VN",
      region: "Southeast Asia",
      lat: 21.0278,
      lng: 105.8342,
      pathwayTypes: "NCUK IFY, BUV 2+2 Bachelor in International Hospitality Management",
      verificationStatus: "VERIFIED",
      featured: true,
      sortOrder: 6,
      summary:
        "Hanoi is home to British University Vietnam (BUV), described in SHV's deck as a leading British-accredited university in Vietnam with British Quality Assurance accreditation. SHV's 2+2 route completes the Bachelor in International Hospitality Management at BUV. Vietnam also appears among the NCUK IFY progression destinations (BUV and RMIT Vietnam).",
      durationNotes: "2 years in Vientiane + 2 years at BUV, Hanoi.",
      progressionNotes: `Transfer after Year 2 at SHV into Year 3 at BUV. The deck's 2026–27 estimate shows BUV tuition of $9k and living expenses of $8k per year. ${FEE_DISCLAIMER}`,
      officialLink: "https://www.buv.edu.vn",
      heroMediaId: photo.buvCampus,
      sourceNote: `${deck("buv", "p1-3, p8")} ${deck("ify", "p3")}`,
    },
    {
      slug: "thailand",
      country: "Thailand",
      isoCode: "TH",
      region: "Southeast Asia",
      lat: 13.7563,
      lng: 100.5018,
      pathwayTypes: "NCUK IFY, Assumption University 1+3 Bachelor's + Master's (SIMBA)",
      verificationStatus: "VERIFIED",
      featured: true,
      sortOrder: 7,
      summary:
        "Bangkok is home to Assumption University, described in SHV's deck as one of Thailand's most established private international universities, with modern campuses, an international community and global partner universities. The 1+3 route leads to a Bachelor's and a Master's degree in four years, one of them spent at home in Vientiane. Thailand (Assumption University) also appears among the NCUK IFY progression destinations.",
      durationNotes: "1 year in Vientiane + 3 years at Assumption University, Bangkok.",
      progressionNotes: `Transfer after Year 1 at SHV. The deck's 2026–27 estimate shows living expenses at AU of $9k per year. ${FEE_DISCLAIMER}`,
      officialLink: "https://www.au.edu",
      heroMediaId: photo.auCampus,
      sourceNote: `${deck("au", "p1, p4, p10")} ${deck("ify", "p3")}`,
    },
    {
      slug: "malaysia",
      country: "Malaysia",
      isoCode: "MY",
      region: "Southeast Asia",
      lat: 3.139,
      lng: 101.6869,
      pathwayTypes: "NCUK IFY",
      verificationStatus: "VERIFIED",
      featured: false,
      sortOrder: 8,
      summary:
        "SHV's NCUK International Foundation Year deck shows Malaysian progression destinations including the University of Nottingham Malaysia, University of Southampton Malaysia, Newcastle University Medicine Malaysia, Swinburne University of Technology Sarawak and the University of Reading Malaysia.",
      progressionNotes: "Progression through NCUK, subject to the published requirements of the chosen university and course.",
      officialLink: "https://www.ncuk.ac.uk/university-partners/",
      sourceNote: deck("ify", "p2-3"),
    },
    {
      slug: "laos",
      country: "Lao PDR",
      isoCode: "LA",
      region: "Southeast Asia",
      lat: 17.9757,
      lng: 102.6331,
      pathwayTypes: "BBA Entrepreneurship & Innovation Gen AI (3 years at SHV, awarded by NUOL), Intensive English",
      verificationStatus: "VERIFIED",
      featured: false,
      sortOrder: 9,
      summary:
        "Study entirely in Vientiane. The Business Administration degree in Entrepreneurship & Innovation Gen AI is taught in Lao on the SHV campus over three years plus a 24-week internship, with the Bachelor's degree awarded by the National University of Laos (NUOL) and the Year 3 top-up taught by NUOL professors. English runs through all three years, from beginner to a CEFR B2 target.",
      durationNotes: "3 years on the SHV campus + 24-week internship.",
      progressionNotes: "Graduates hold a NUOL Bachelor's degree and English at B2 level, ready to apply for a master's degree domestically or internationally (specific university and country requirements vary).",
      sourceNote: deck("bba", "p1, p4, p6, p8, p12"),
    },
  ];
  const destBySlug: Record<string, string> = {};
  for (const d of destinations) {
    const row = await prisma.destination.upsert({ where: { slug: d.slug }, update: { ...d, ...PUB }, create: { ...d, ...PUB } });
    destBySlug[d.slug] = row.id;
  }

  // ── Universities ───────────────────────────────────────────────────────────
  const universities = [
    {
      slug: "ncuk-university-partners",
      name: "NCUK University Partners (network)",
      city: "Worldwide",
      destinationId: destBySlug["united-kingdom"],
      website: "https://www.ncuk.ac.uk/university-partners/",
      partnershipType: "NCUK_NETWORK",
      summary:
        "NCUK describes a network of 80+ University Partners in the UK, Australia, New Zealand, USA, Canada and other locations, offering 6,000+ degree courses. Students completing an NCUK qualification at SHV apply to these universities through NCUK. SHV's IFY deck maps progression destinations in the UK, Australia, New Zealand, the USA, Canada, France, Vietnam, Malaysia and Thailand.",
      progressionInfo: "NCUK states: \"Guaranteed* entry to one of 80+ NCUK University Partners worldwide\" for International Foundation Year students (*conditions apply; see NCUK).",
      transferPoint: "Year 1 (after IFY) or Year 2 (after International Year One)",
      featured: true,
      sortOrder: 0,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: `[NCUK-IFY] [NCUK-IY1] ${deck("ify", "p2-3")}`,
    },
    {
      slug: "british-university-vietnam",
      name: "British University Vietnam",
      city: "Hanoi",
      destinationId: destBySlug["vietnam"],
      website: "https://www.buv.edu.vn",
      partnershipType: "DIRECT_PARTNER",
      summary:
        "British University Vietnam (BUV, \"Home of the Lionhearted\") is described in SHV's programme deck as a leading British-accredited university in Vietnam with British Quality Assurance accreditation. SHV students on the 2+2 route complete Years 3 and 4 of the Bachelor in International Hospitality Management at BUV's Hanoi campus.",
      programmesOffered: "Bachelor in International Hospitality Management (2+2 with SHV): Year 3 — project management, consumer behaviour, service business strategy, industry exposure; Year 4 — career development, capstone / applied project, management readiness, professional network.",
      progressionInfo: `Progression after two years at SHV into Year 3 of the Bachelor in International Hospitality Management. BUV scholarships of 100%, 50% and 25% are advertised for the 2026 intake; award criteria are confirmed by BUV. The deck's 2026–27 estimate shows BUV tuition of $9k plus $8k living per year (exchange rate 1$ = VND 26,300). ${FEE_DISCLAIMER}`,
      transferPoint: "After Year 2 at SHV → Year 3 at BUV, Hanoi",
      featured: true,
      sortOrder: 1,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: deck("buv", "p1-3, p7-10"),
    },
    {
      slug: "assumption-university",
      name: "Assumption University of Thailand",
      city: "Bangkok",
      destinationId: destBySlug["thailand"],
      website: "https://www.au.edu",
      logoMediaId: logoAssumption.id,
      partnershipType: "DIRECT_PARTNER",
      summary:
        "Assumption University (Bangkok, since 1969) is described in SHV's programme deck as one of Thailand's most established private international universities, with modern campuses, an international community and global partner universities. On the 1+3 route it awards both the Bachelor's and the Master's degree. The deck records the partnership signing between SHV and Assumption University.",
      programmesOffered: "SIMBA — Smart Integration in Management & Business Analytics: Bachelor's major (management & strategy, marketing and communication, sustainable business / entrepreneurship, data analytics & applied informatics, international business projects) followed by a Master's-level year (business & advanced technology management; leadership, innovation and change; business analytics / digital transformation; research, capstone or final project; industry practice and career preparation).",
      progressionInfo: `After Year 1 at SHV, students complete the Bachelor's major (Years 2–3) and a Master's-level year (Year 4) at Assumption University — two degrees in four years, compared with 6+ years on the traditional route. Tuition of $27,000 for the AU years is payable within the three years; living expenses are estimated at $9k per year. ${FEE_DISCLAIMER}`,
      transferPoint: "After Year 1 at SHV → Assumption University, Bangkok (Years 2–4)",
      featured: true,
      sortOrder: 2,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: deck("au", "p1, p3-6, p10"),
    },
    {
      slug: "esdes-lyon-business-school",
      name: "ESDES Business School (Lyon)",
      city: "Lyon",
      destinationId: destBySlug["france"],
      website: "https://www.esdes.fr",
      logoMediaId: logoEsdes.id,
      partnershipType: "DIRECT_PARTNER",
      summary:
        "ESDES Business School (Lyon–Annecy) is part of UCLY — Université Catholique de Lyon, founded in 1875 with 12,000 students. SHV's 1+3 route leads to the Bachelor in International Business, taught 100% in English. Year 2 at ESDES includes four months abroad at a partner campus (Greece, Argentina, Morocco, Vietnam, USA, Poland, Italy, United Kingdom, Hungary, Uruguay or Brazil), and students have access to paid internships and student housing at Maison Saint-Laurent.",
      programmesOffered: "Bachelor in International Business (3 years, 100% English): Year 1 — build strong business foundations; Year 2 — expand your skills and experience the world (four months abroad); Year 3 — specialise and prepare for your career.",
      progressionInfo: `Students who complete the NCUK International Foundation Year at SHV progress to Year 1 of the three-year Bachelor in International Business in Lyon. Merit scholarships of up to 30% for the first year at ESDES may be awarded for outstanding academic achievement (for example an NCUK IFY average of 75% or above across all modules, or Lao Mor 7 GPA 8.5–10 with strong grades in relevant subjects); a 10% early-bird discount applies to the first year when payment is made five months before the intake. The deck's 2026–27 estimate shows ESDES tuition of $10.5k plus $12k living per year (exchange rate 1€ = $1.1386). ${FEE_DISCLAIMER}`,
      transferPoint: "After the NCUK IFY at SHV → Year 1 at ESDES, Lyon",
      featured: true,
      sortOrder: 3,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: deck("esdes", "p1-4, p7-10, p13"),
    },
    {
      slug: "university-of-nottingham",
      name: "University of Nottingham",
      city: "Nottingham (UK) · Semenyih (Malaysia) · Ningbo (China)",
      destinationId: destBySlug["malaysia"],
      website: "https://www.nottingham.ac.uk",
      logoMediaId: logoNottingham.id,
      partnershipType: "NCUK_NETWORK",
      summary:
        "The University of Nottingham (UK | China | Malaysia) appears in SHV's NCUK International Foundation Year deck among the progression destinations after successful IFY completion, and the University of Nottingham Malaysia is shown among the NCUK University Partners in Malaysia. No SHV-specific programme deck exists for Nottingham; progression is through NCUK.",
      progressionInfo: "Progression through NCUK after the International Foundation Year, subject to the published entry requirements of the chosen campus and course.",
      transferPoint: "After the NCUK IFY at SHV → Year 1",
      featured: false,
      sortOrder: 4,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: deck("ify", "p2-3"),
    },
    {
      slug: "national-university-of-laos",
      name: "National University of Laos (NUOL)",
      city: "Vientiane",
      destinationId: destBySlug["laos"],
      partnershipType: "DIRECT_PARTNER",
      summary:
        "The National University of Laos (founded 1996) is SHV's academic collaboration partner for the Business Administration degree in Entrepreneurship & Innovation Gen AI. Students study at SHV; the Year 3 top-up year is taught by NUOL professors on the St Hugh's campus and the Bachelor's degree is awarded by NUOL.",
      programmesOffered: "Business Administration — Entrepreneurship & Innovation Gen AI (Bachelor's degree awarded by NUOL after a Diploma and an Associate degree from St Hugh's).",
      progressionInfo: "Clear progression: Diploma (Year 1) → Associate degree (Year 2) → NUOL Bachelor's (Year 3 top-up + 24-week internship with report defence). Structure and modules are indicative and may change through academic review and quality assurance.",
      transferPoint: "No transfer — all three years on the SHV campus",
      featured: true,
      sortOrder: 5,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: deck("bba", "p1, p4, p6"),
    },
  ];
  const uniBySlug: Record<string, string> = {};
  for (const u of universities) {
    const row = await prisma.university.upsert({ where: { slug: u.slug }, update: u, create: u });
    uniBySlug[u.slug] = row.id;
  }

  // ── Programmes ─────────────────────────────────────────────────────────────
  // Generic placeholders from the earlier seed are superseded by the decks — remove them.
  await prisma.programme.deleteMany({ where: { slug: { in: ["bachelor-pathway-1-plus-3", "bachelor-pathway-2-plus-2-vietnam", "bachelor-finance-economics"] } } });

  type ModuleSeed = { title: string; kind: string; order: number; description?: string };
  async function upsertProgramme(slug: string, data: Record<string, unknown>, modules: ModuleSeed[]) {
    const existing = await prisma.programme.findUnique({ where: { slug } });
    if (existing) {
      await prisma.programmeModule.deleteMany({ where: { programmeId: existing.id } });
      return prisma.programme.update({ where: { slug }, data: { ...data, modules: { create: modules } } });
    }
    return prisma.programme.create({ data: { slug, ...data, modules: { create: modules } } as never });
  }

  const ify = await upsertProgramme(
    "ncuk-international-foundation-year",
    {
      code: "NCUK-IFY",
      heroMediaId: photo.class1,
      title: "NCUK International Foundation Year",
      shortTitle: "International Foundation Year",
      type: "FOUNDATION",
      awardingBody: "NCUK",
      level: "Pre-university foundation",
      summary:
        "Bachelor's degree Pathway (1+3): Mor 7 graduates spend nine months at SHV's NCUK Study Centre in Vientiane studying at least five modules, then progress to three years of a bachelor's degree abroad at an NCUK University Partner or one of SHV's direct partners.",
      description: `## The 1+3 pathway at SHV

**Mor 7 graduate → 1st year at St Hugh's (NCUK Study Centre) → 3 years Bachelor abroad.** Start here, then study abroad later. The NCUK International Foundation Year (IFY) is a pre-university programme that prepares students for first-year undergraduate entry at NCUK University Partners worldwide. At St Hugh's College Vientiane it is delivered in Vientiane, so students complete their foundation year close to home before progressing abroad.

## What you will study for 9 months in Vientiane

You will study at least 5 modules. For example:

- **Business**
- **Economics**
- **EAP — English for Academic Purposes**, accepted by NCUK University Partners in place of IELTS for progression
- **Global Studies**
- **Integrated Math**
- **Skills-based module**

Across its network NCUK lists IFY subject modules including Art & Design, Biology, Business Studies, Chemistry, Computer Science, Economics, Further Maths, Global Studies, Integrated Maths, Physics, Sociology and Technical Maths. The modules offered at SHV are confirmed each intake.

## Assessment and qualification

Assessment combines coursework and examinations set and quality-assured by NCUK. On completion students receive an NCUK certificate confirming successful completion of the programme and a transcript detailing module results.

## Progression destinations after successful IFY completion

SHV's deck maps progression anywhere in the world*: the **United Kingdom** (more than fifty NCUK partners, including QS World Top 100 universities), **Australia**, **New Zealand**, the **United States**, **Canada**, **France** (ESDES Business School), **Vietnam** (British University Vietnam, RMIT Vietnam), **Malaysia** (University of Nottingham Malaysia, University of Southampton Malaysia, Newcastle University Medicine Malaysia, Swinburne Sarawak, University of Reading Malaysia) and **Thailand** (Assumption University).

NCUK states that IFY students have "Guaranteed* entry to one of 80+ NCUK University Partners worldwide" (*subject to NCUK's conditions). Students apply to universities through NCUK's dedicated support, and progression depends on meeting the published entry grades of the chosen course.

## Who can apply?

- Age 17+
- English: IELTS 5.5 or equivalent
- Mor 7 (M.7) certificate + transcript

## Fees

Fees payable: tuition fee, application fee, registration fee and uniform. Amounts are confirmed by the admissions team.

## Estimated cost of study 2026–27

SHV's deck compares one year of study by tuition and living cost: **Laos (SHV) $14k tuition**, against UK $25k tuition + $35k living ($60k), Singapore $20k + $35k ($57k), Australia $24k + $35k ($59k), New Zealand $24k + $30k ($54k) and Thailand $23k + $9k ($31k). Start locally, build confidence, then move to the international level.

_${FEE_DISCLAIMER}_`,
      whoFor:
        "Mor 7 graduates aged 17+ who want a structured, internationally recognised route into a bachelor's degree abroad, starting in Vientiane.",
      durationLabel: "9 months in Vientiane (one academic year)",
      durationMonths: 9,
      intakesJson: JSON.stringify(["September"]),
      subjectRoutesJson: JSON.stringify(["Business", "Science & Engineering", "Humanities & Social Sciences"]),
      entryRequirements:
        "SHV's stated requirements: age 17+, Mor 7 (M.7) certificate and transcript. NCUK's typical network requirement is IGCSE / O Level / GCSE with four modules at grade 4 or above (usually including English and Maths), or equivalent. SHV confirms equivalencies for Lao and regional qualifications during consultation.",
      englishRequirement: "IELTS 5.5 or equivalent — SHV's stated entry standard for its IFY intake. (NCUK's network minimum for the IFY is IELTS 5.0 or equivalent.)",
      assessment: "Coursework and examinations set and quality-assured by NCUK.",
      qualification: "NCUK International Foundation Year certificate and transcript.",
      progression: "First-year entry to NCUK University Partners in the UK, Australia, New Zealand, USA, Canada and Malaysia, or to SHV's direct partners ESDES Business School (France), British University Vietnam and Assumption University (Thailand), subject to course requirements.",
      whatNext: "Apply to NCUK University Partners with NCUK's university placement support, then begin Year 1 of a bachelor's degree — three years abroad after one year at home.",
      applicationNotes: "September start. Book a free consultation to check your qualifications and English level against the entry requirements.",
      featured: true,
      sortOrder: 0,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: `[NCUK-IFY] [NCUK-SHV] ${deck("ify", "p1-6")} — SHV timetable is an example only (p11)`,
      ownerId: admin.id,
      effectiveDate: new Date("2025-09-01"),
      reviewDate: new Date("2027-06-01"),
      seoTitle: "NCUK International Foundation Year in Vientiane — Bachelor's degree Pathway (1+3)",
      seoDescription: "Study the NCUK International Foundation Year at St Hugh's College Vientiane: 9 months at home, then 3 years of a bachelor's degree abroad.",
    },
    [
      { title: "English for Academic Purposes (EAP)", kind: "ENGLISH", order: 0, description: "Academic English accepted by NCUK University Partners in lieu of IELTS for progression." },
      { title: "Business", kind: "SUBJECT", order: 1, description: "Example subject module shown in SHV's IFY deck." },
      { title: "Economics", kind: "SUBJECT", order: 2, description: "Example subject module shown in SHV's IFY deck." },
      { title: "Global Studies", kind: "SUBJECT", order: 3, description: "Example subject module shown in SHV's IFY deck." },
      { title: "Integrated Math", kind: "SUBJECT", order: 4, description: "Example subject module shown in SHV's IFY deck." },
      { title: "Skills-based module", kind: "SKILLS", order: 5, description: "Independent study, research and academic skills (NCUK's Skills for Success is delivered online)." },
    ],
  );

  const iy1 = await upsertProgramme(
    "ncuk-international-year-one-business-management",
    {
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
      reviewDate: new Date("2027-06-01"),
      seoTitle: "NCUK International Year One in Business Management, Vientiane",
      seoDescription: "Start your business degree in Vientiane with the NCUK International Year One and progress to Year 2 at NCUK University Partners.",
    },
    [
      { title: "English for Academic Purposes", kind: "ENGLISH", order: 0 },
      { title: "Business Management core modules", kind: "CORE", order: 1, description: "First-year undergraduate level modules set by NCUK. Module titles for the SHV intake are confirmed by the academic team." },
    ],
  );

  const buvProgramme = await upsertProgramme(
    "bachelor-international-hospitality-management",
    {
      code: "SHV-BUV-IHM-2+2",
      heroMediaId: photo.buvCampus,
      title: "Bachelor in International Hospitality Management (2+2 with British University Vietnam)",
      shortTitle: "International Hospitality Management 2+2",
      type: "BACHELOR_PATHWAY",
      awardingBody: "British University Vietnam",
      level: "Bachelor's degree",
      summary:
        "From Laos to an international hospitality leader: two years in Vientiane, then two years at British University Vietnam in Hanoi to complete a British-accredited Bachelor in International Hospitality Management.",
      description: `## The 2+2 route leads to British University Vietnam

Start in Laos and complete your Bachelor's degree at British University Vietnam (BUV). BUV is a leading British-accredited university in Vietnam with British Quality Assurance accreditation. The route is a balanced mix of English, operations, business and management.

## Year by year

- **Year 1 — St Hugh's College Vientiane:** English for Higher Education · academic skills · hospitality & tourism foundation · professional etiquette
- **Year 2 — St Hugh's College Vientiane:** F&B and rooms operations · people and diversity · hospitality marketing · practical service standards
- **Year 3 — BUV, Hanoi:** project management · consumer behaviour · service business strategy · industry exposure
- **Year 4 — BUV, Hanoi:** career development · capstone / applied project · management readiness · professional network

## A career ladder parents can understand

From first professional role to management leadership:

1. **Management Trainee** — learn the business
2. **Supervisor** — lead a small team
3. **Assistant Manager** — manage operations
4. **Department Manager** — own a function
5. **General Manager / Entrepreneur** — lead the business

## Who can apply?

- Age 17+
- English: IELTS 4.5 or equivalent
- Mor 7 (Grade 7 / M.7) certificate + transcript
- Students start in **September**

## Fees

Fees payable: tuition fee, application fee, registration fee, uniform, books & practical equipment. Amounts are confirmed by the admissions team.

## Estimated cost of study 2026–27

2 years at St Hugh's + 2 years at British University Vietnam:

- **Year 1 — SHV, Vientiane:** $5.5k tuition
- **Year 2 — SHV, Vientiane:** $9k* tuition
- **Year 3 — BUV, Hanoi:** $9k* tuition + $8k living expenses = $17k
- **Year 4 — BUV, Hanoi:** $9k* tuition + $8k living expenses = $17k
- **Estimated 4-year total: $48.6k**

With a **25% BUV scholarship**: $4.2k · $6.9k · $14.9k · $14.9k — **estimated 4-year total $40.9k**. BUV scholarships of 100%, 50% and 25% are advertised for the 2026 intake.

_*Fees at BUV are for illustration only (exchange rate 1$ = VND 26,300). BUV reserves the right to make any increases of fees that are deemed necessary annually. ${FEE_DISCLAIMER}_`,
      studyLocation: "St Hugh's College Vientiane (Years 1–2) · British University Vietnam, Hanoi (Years 3–4)",
      whoFor: "Mor 7 graduates aged 17+ who want a British-accredited hospitality management degree, starting close to home and finishing in Hanoi.",
      durationLabel: "4 years (2 in Vientiane + 2 in Hanoi)",
      durationMonths: 48,
      intakesJson: JSON.stringify(["September"]),
      subjectRoutesJson: JSON.stringify(["International Hospitality Management"]),
      entryRequirements: "Age 17+; Mor 7 (Grade 7 / M.7) certificate and transcript.",
      englishRequirement: "IELTS 4.5 or equivalent.",
      qualification: "Bachelor in International Hospitality Management awarded by British University Vietnam (British-accredited; British Quality Assurance accreditation).",
      progression: "After two years at SHV, students progress to Years 3 and 4 at British University Vietnam in Hanoi and graduate with the BUV degree.",
      whatNext: "Career ladder: Management Trainee → Supervisor → Assistant Manager → Department Manager → General Manager / Entrepreneur.",
      applicationNotes: `September start. Fees payable: tuition, application, registration, uniform, books & practical equipment (amounts confirmed by admissions). Estimated 4-year cost 2026–27: $48.6k, or $40.9k with a 25% BUV scholarship. ${FEE_DISCLAIMER}`,
      featured: true,
      sortOrder: 2,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: deck("buv", "p1-4, p7-10"),
      ownerId: admin.id,
      effectiveDate: new Date("2026-09-01"),
      reviewDate: new Date("2027-06-01"),
      seoTitle: "Bachelor in International Hospitality Management — 2+2 with British University Vietnam",
      seoDescription: "Two years at St Hugh's College Vientiane, two years at British University Vietnam in Hanoi. IELTS 4.5, age 17+, September start.",
    },
    [
      { title: "Year 1 at SHV — foundations", kind: "CORE", order: 0, description: "English for Higher Education; academic skills; hospitality & tourism foundation; professional etiquette." },
      { title: "Year 2 at SHV — operations", kind: "CORE", order: 1, description: "F&B and rooms operations; people and diversity; hospitality marketing; practical service standards." },
      { title: "Year 3 at BUV — business", kind: "CORE", order: 2, description: "Project management; consumer behaviour; service business strategy; industry exposure." },
      { title: "Year 4 at BUV — management", kind: "CORE", order: 3, description: "Career development; capstone / applied project; management readiness; professional network." },
    ],
  );

  const auProgramme = await upsertProgramme(
    "bachelor-master-pathway-assumption-university",
    {
      code: "SHV-AU-SIMBA-1+3",
      heroMediaId: photo.auCampus,
      title: "Bachelor's + Master's Pathway (1+3) with Assumption University — SIMBA",
      shortTitle: "Bachelor's + Master's 1+3 (Assumption University)",
      type: "BACHELOR_PATHWAY",
      awardingBody: "Assumption University of Thailand",
      level: "Bachelor's and Master's degrees",
      summary:
        "Start in Laos. Become ready for the world. One year at St Hugh's College Vientiane followed by three years at Assumption University, Bangkok — graduating with both a Bachelor's and a Master's degree in just four years.",
      description: `## A faster, smarter route to a world-class business education

- **2 degrees earned** — a Bachelor's and a Master's from Assumption University
- **4 years total** — compared with 6+ years on the traditional route
- **1 year at home** — Year 1 is taught at St Hugh's College, close to family

The future will reward different skills. Business is changing, AI is changing, careers are changing: students need more than a degree — they need judgement, confidence and digital fluency. The pathway builds **strategy** (business thinking), **AI + data** (technology fluency) and **English** (international communication).

## Two trusted institutions, one seamless journey

**Assumption University** — one of Thailand's most established private international universities; modern campuses, an international community and global partner universities; awards both the Bachelor's and the Master's degree.

**St Hugh's College Vientiane** — part of the Panyathip group; small classes and personal academic mentoring; experienced in preparing Lao students for international universities; your local point of contact for all four years.

## What is SIMBA?

**SIMBA — Smart Integration in Management & Business Analytics** combines business theory with technological expertise so students can create practical solutions for digital industries: business + analytics (strategy, management, innovation and entrepreneurship), technology fluency, and practical learning through projects, mentorship and experience-based courses.

## One pathway. Four years. A bigger future.

- **Year 1 — St Hugh's College Vientiane:** academic English & presentation · business foundations · digital business & AI literacy · quantitative / analytics readiness · study skills, mentoring & confidence
- **Years 2–3 — Bachelor's major, Assumption University:** management & strategy · marketing and communication · sustainable business / entrepreneurship · data analytics & applied informatics · international business projects
- **Year 4 — Master's, Assumption University:** business & advanced technology management · leadership, innovation and change · business analytics / digital transformation · research, capstone or final project · industry practice and career preparation

## From Laos to the world

A business degree should open more than one door: entrepreneur, analyst, manager, marketer, family business successor, ASEAN professional.

## Estimated cost of study 2026–27

1 year at St Hugh's + 3 years at Assumption University:

- **Year 1 — SHV, Vientiane:** $9k* tuition
- **Year 2 — AU, Bangkok:** $9k* tuition + $9k living expenses = $18k
- **Year 3 — AU, Bangkok:** $9k* tuition + $9k living expenses = $18k
- **Year 4 — AU, Bangkok:** $9k living expenses
- **Estimated 4-year total: $54k**

_*The $27,000 tuition fee must be paid within the 3 years._ The deck's cost comparison (approximate 4-year total) shows St Hugh's × Assumption University at $27k against a UK university $120k, an Australian university $110k and a Singapore university $85k.

_${FEE_DISCLAIMER}_`,
      studyLocation: "St Hugh's College Vientiane (Year 1) · Assumption University, Bangkok (Years 2–4)",
      whoFor: "Students who want a Bachelor's and a Master's in business and analytics in four years, with the first year taught close to family in Vientiane.",
      durationLabel: "4 years (1 in Vientiane + 3 in Bangkok) — 2 degrees",
      durationMonths: 48,
      intakesJson: JSON.stringify([]),
      subjectRoutesJson: JSON.stringify(["SIMBA — Smart Integration in Management & Business Analytics"]),
      qualification: "Bachelor's degree and Master's degree, both awarded by Assumption University of Thailand.",
      progression: "After Year 1 at SHV → Bachelor's major (Years 2–3) → Master's-level year (Year 4) at Assumption University, Bangkok.",
      whatNext: "Entrepreneur. Analyst. Manager. Marketer. Family business successor. ASEAN professional.",
      applicationNotes: `Entry requirements and intake dates for this route are confirmed by the admissions team. Tuition of $27,000 for the Assumption University years must be paid within the three years. Estimated 4-year cost 2026–27: $54k. ${FEE_DISCLAIMER}`,
      featured: true,
      sortOrder: 3,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: `${deck("au", "p1-6, p8-10")} — entry requirements and intake month are not stated in the deck (left empty)`,
      ownerId: admin.id,
      effectiveDate: new Date("2026-09-01"),
      reviewDate: new Date("2027-06-01"),
      seoTitle: "Bachelor's + Master's in 4 years — 1+3 with Assumption University, Bangkok",
      seoDescription: "One year at St Hugh's College Vientiane, three years at Assumption University. Two degrees (SIMBA — Management & Business Analytics) in four years.",
    },
    [
      { title: "Year 1 at SHV — readiness year", kind: "CORE", order: 0, description: "Academic English & presentation; business foundations; digital business & AI literacy; quantitative / analytics readiness; study skills, mentoring & confidence." },
      { title: "Years 2–3 at Assumption University — Bachelor's major", kind: "CORE", order: 1, description: "Management & strategy; marketing and communication; sustainable business / entrepreneurship; data analytics & applied informatics; international business projects." },
      { title: "Year 4 at Assumption University — Master's", kind: "CORE", order: 2, description: "Business & advanced technology management; leadership, innovation and change; business analytics / digital transformation; research, capstone or final project; industry practice and career preparation." },
    ],
  );

  const esdesProgramme = await upsertProgramme(
    "bachelor-international-business-esdes",
    {
      code: "SHV-ESDES-BIB-1+3",
      heroMediaId: photo.esdesCampus,
      title: "Bachelor in International Business (1+3 with ESDES Business School, Lyon)",
      shortTitle: "Bachelor in International Business 1+3 (ESDES)",
      type: "BACHELOR_PATHWAY",
      awardingBody: "ESDES Business School (UCLY)",
      level: "Bachelor's degree",
      summary:
        "Start your Bachelor in Business in Lao PDR and finish your degree at ESDES Business School in Lyon, France: the NCUK International Foundation Year at SHV, then three years in Lyon, taught 100% in English.",
      description: `## Pathway 1+3: 1 year at St Hugh's and 3 years at ESDES

- **Year 1 (IFY) — St Hugh's College Vientiane:** build the skills to begin your international journey
- **Year 2 (ESDES Year 1) — Lyon:** build strong business foundations
- **Year 3 (ESDES Year 2) — Lyon:** expand your skills and experience the world — students can spend **four months abroad**, fully immersed at a partner campus: Greece (Athens, IST College), Argentina (Buenos Aires, Universidad del Salvador), Morocco (Casablanca, ESCA Business School), Vietnam (Ho Chi Minh City University of Technology), United States (New York, St. John's University), Poland (Kraków, Cracow University of Economics), Italy (Rome, LUMSA), United Kingdom (Glasgow, University of Strathclyde), Hungary (Pécs), Uruguay (Montevideo, Universidad Católica) or Brazil (Rio de Janeiro, PUCPR)
- **Year 4 (ESDES Year 3) — Lyon:** specialise and prepare for your career

The Bachelor in International Business is taught **100% in English**.

## Campus in Lyon

ESDES Business School (Lyon–Annecy) is part of **UCLY**, founded in 1875 with 12,000 students. Lyon is a welcoming European student city where education, culture and international opportunity come together: a dynamic centre for business, innovation and international education; a diverse community with thousands of international students; and the advantages of a major French city without the lifestyle costs of Paris. Student housing is available at Maison Saint-Laurent.

## Possibility of revenues during your studies

- **Fully paid internships** — for internships lasting more than two months you are entitled to mandatory compensation
- **Student jobs** — foreign students can work up to 20 hours per week (the deck shows $13/hour for student jobs in France)

## The other benefits of studying in France

- **Health insurance at no cost** — 60% of medical costs covered; a "mutuelle" (supplementary insurance) covers the remaining costs
- **Student discounts** — public transport; culture (cinemas, theatres, concerts, national museums); affordable meals at university restaurants (Resto'U) for a few euros

## Estimated cost of study 2026–27

1 year at SHV in Laos + 3 years at ESDES in Lyon, France:

- **Year 1 — IFY, SHV Vientiane:** $14k tuition
- **Year 2 — ESDES Year 1, Lyon:** $10.5k* tuition + $12k living expenses = $23k
- **Year 3 — ESDES Year 2, Lyon:** $10.5k* tuition + $12k living expenses = $23k
- **Year 4 — ESDES Year 3, Lyon:** $10.5k* tuition + $12k living expenses = $23k
- **Estimated 4-year total: $83k**

**Scholarships and discounts**

- Merit scholarships might be awarded based on academic achievement**: up to 30% for the 1st year at ESDES
- Early-bird discount of 10% for the 1st year (payment 5 months before the intake)

_**Students with outstanding grades, high standardised test scores, or other exceptional educational achievements — for example NCUK IFY: an average score of 75% or above across all modules; Lao Mor 7: GPA 8.5–10 with strong grades in relevant subjects._

_*Fees at ESDES are for illustration only (exchange rate 1€ = $1.1386). ESDES reserves the right to make any increases of fees that are deemed necessary annually. ${FEE_DISCLAIMER}_`,
      studyLocation: "St Hugh's College Vientiane (Year 1, NCUK IFY) · ESDES Business School, Lyon (Years 2–4)",
      whoFor: "Mor 7 graduates who want a European business degree taught in English, with one year at home before three years in Lyon.",
      durationLabel: "4 years (1 in Vientiane + 3 in Lyon)",
      durationMonths: 48,
      intakesJson: JSON.stringify(["September (NCUK IFY at SHV)"]),
      subjectRoutesJson: JSON.stringify(["International Business"]),
      entryRequirements: "Year 1 is the NCUK International Foundation Year at SHV: age 17+, Mor 7 (M.7) certificate and transcript. Progression to ESDES requires successful completion of the IFY.",
      englishRequirement: "IELTS 5.5 or equivalent for IFY entry (SHV's stated standard). The ESDES Bachelor in International Business is taught 100% in English.",
      qualification: "Bachelor in International Business awarded by ESDES Business School, Lyon (UCLY).",
      progression: "After the NCUK International Foundation Year at SHV → Year 1 of the three-year Bachelor in International Business at ESDES, Lyon.",
      whatNext: "Paid internships during study and four months abroad in the second ESDES year; graduates hold a French bachelor's degree in international business.",
      applicationNotes: `Merit scholarships of up to 30% for the first ESDES year (e.g. NCUK IFY average 75%+, Lao Mor 7 GPA 8.5–10) and a 10% early-bird discount when the first year is paid five months before intake. Estimated 4-year cost 2026–27: $83k. ${FEE_DISCLAIMER}`,
      featured: true,
      sortOrder: 4,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: `${deck("esdes", "p1-5, p8-10, p13")} ${deck("ify", "p5")}`,
      ownerId: admin.id,
      effectiveDate: new Date("2026-09-01"),
      reviewDate: new Date("2027-06-01"),
      seoTitle: "Bachelor in International Business — 1+3 with ESDES Business School, Lyon",
      seoDescription: "One year at St Hugh's College Vientiane (NCUK IFY), three years at ESDES Business School in Lyon, France. Taught 100% in English, with four months abroad.",
    },
    [
      { title: "Year 1 — NCUK International Foundation Year at SHV", kind: "CORE", order: 0, description: "Build the skills to begin your international journey." },
      { title: "Year 2 — ESDES Year 1, Lyon", kind: "CORE", order: 1, description: "Build strong business foundations." },
      { title: "Year 3 — ESDES Year 2, Lyon (4 months abroad)", kind: "CORE", order: 2, description: "Expand your skills and experience the world: four months fully immersed at one of eleven partner campuses." },
      { title: "Year 4 — ESDES Year 3, Lyon", kind: "CORE", order: 3, description: "Specialise and prepare for your career." },
    ],
  );

  const iep = await upsertProgramme(
    "intensive-english-programme",
    {
      code: "SHV-IEP",
      heroMediaId: photo.teacher,
      title: "Intensive English Programme",
      shortTitle: "Intensive English",
      type: "LANGUAGE",
      awardingBody: "St Hugh's College Vientiane (SHV Certificate of Completion)",
      level: "CEFR A0 → lower B2 (approx. IELTS 3.0 → 5.5)",
      summary:
        "English starts here. From zero or low English to university-entry readiness: five 8-week levels, 3 hours a day, 5 days a week, with Cambridge English materials — for Mor 7 graduates and gap-year students.",
      description: `## Finished Mor 7. What is the next step?

For many students, English is the barrier between school and an international future. The answer is not "more English classes" — it is a structured pathway: communication in real situations, daily practice and correction, IELTS / pathway readiness and a clear 8-week study plan.

## Five levels. One clear journey.

Each level is **8 weeks · 120 hours · 3 hours a day · 5 days a week**. Complete beginners normally need up to 40 weeks to reach IELTS 5.5 readiness.

- **Level 1 — English Foundations (A0 → A1, ~IELTS 3.0):** essential vocabulary, pronunciation and basic communication
- **Level 2 — Everyday English (A1 → A2, ~IELTS 3.5–4.0):** everyday conversations, short messages and simple paragraphs
- **Level 3 — Independent English I (A2 → lower B1, ~IELTS 4.0–4.5):** longer speaking, reading, writing and presentations
- **Level 4 — Independent English II (lower B1 → B1+, ~IELTS 4.5):** academic study skills and introduction to IELTS tasks
- **Level 5 — Academic English & IELTS (B1+ → lower B2, ~IELTS 5.5):** academic reading, writing, lectures and IELTS strategies

Entry is based on a placement assessment. Students with some English may start above Level 1.

## What students learn each day

A balanced three-hour lesson — not passive textbook study:

- 25 min — warm-up, vocabulary, pronunciation
- 50 min — core English lesson
- 40 min — listening or reading development
- 40 min — speaking or writing practice
- 15 min — task, project or progress check

The objective is active English use: students speak, listen, write, receive feedback and practise again.

## Cambridge-supported learning

Recognised English course materials plus structured digital practice: Cambridge English materials selected for each level; individual Cambridge One access (digital practice, audio, video and interactive activities); and teacher monitoring of assignments and progress checks beyond the classroom. SHV prepares students for Cambridge English Qualifications and IELTS.

## Parents can see the progress

The programme is intensive, but it is also monitored and transparent: a placement assessment to start at the correct level, a mid-course review, an end-level assessment to check readiness for the next level, and progress feedback with clear advice for student and parents. No false promise. No blind progression. Students move forward when they are academically ready.

## What success looks like

- **After Levels 1–2:** can introduce themselves, ask questions and communicate in daily situations
- **After Levels 3–4:** can speak for longer, write organised paragraphs and understand clearer classroom English
- **After Level 5:** can prepare for IELTS Academic 5.5 and begin university pathway study with stronger confidence

For a complete beginner, SHV recommends a realistic standard pathway of up to five 8-week levels.

## Programme fee and what is included

**$995 per 8-week level** — simple all-inclusive pricing from English Foundations to Academic English & IELTS. Included in every level:

- 120 classroom hours
- Cambridge English Student's Book with Digital Pack
- Individual Cambridge One digital access
- Assessments and progress feedback
- Guided ICT-room self-study
- SHV Certificate of Completion`,
      whoFor: "Mor 7 graduates and gap-year students who need to move from zero or low English to university-entry readiness.",
      durationLabel: "8 weeks per level (120 hours); up to 40 weeks for complete beginners",
      durationMonths: 9,
      intakesJson: JSON.stringify([]),
      subjectRoutesJson: JSON.stringify(["English Foundations", "Everyday English", "Independent English I", "Independent English II", "Academic English & IELTS"]),
      entryRequirements: "Placement assessment determines the starting level; students with some English may start above Level 1. Designed for Mor 7 graduates and gap-year students.",
      englishRequirement: "None — entry from complete beginner (A0/A1).",
      assessment: "Placement assessment; mid-course review; end-level assessment; progress feedback for student and parents. Students progress when academically ready.",
      qualification: "SHV Certificate of Completion for each level.",
      progression: "After Level 5 (lower B2, ~IELTS 5.5) students can prepare for IELTS Academic 5.5 and begin university pathway study — for example the NCUK International Foundation Year, for which SHV's stated English requirement is IELTS 5.5 or equivalent.",
      whatNext: "Move into an SHV pathway programme: NCUK International Foundation Year, the 2+2 with British University Vietnam (IELTS 4.5), or another route.",
      applicationNotes: "$995 per 8-week level, all-inclusive. Book a placement assessment to find your starting level. Start dates for each level are confirmed by the admissions team.",
      featured: true,
      sortOrder: 5,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: `${deck("iep", "p1-8")} — start dates are not stated in the deck`,
      ownerId: admin.id,
      effectiveDate: new Date("2026-09-01"),
      reviewDate: new Date("2027-06-01"),
      seoTitle: "Intensive English Programme in Vientiane — from zero to IELTS 5.5 readiness",
      seoDescription: "Five 8-week levels, 3 hours a day, 5 days a week, with Cambridge English materials. $995 per level, all-inclusive, at St Hugh's College Vientiane.",
    },
    [
      { title: "Level 1 — English Foundations (A0 → A1)", kind: "ENGLISH", order: 0, description: "Essential vocabulary, pronunciation and basic communication. ~IELTS 3.0. 8 weeks · 120 hours." },
      { title: "Level 2 — Everyday English (A1 → A2)", kind: "ENGLISH", order: 1, description: "Everyday conversations, short messages and simple paragraphs. ~IELTS 3.5–4.0. 8 weeks · 120 hours." },
      { title: "Level 3 — Independent English I (A2 → lower B1)", kind: "ENGLISH", order: 2, description: "Longer speaking, reading, writing and presentations. ~IELTS 4.0–4.5. 8 weeks · 120 hours." },
      { title: "Level 4 — Independent English II (lower B1 → B1+)", kind: "ENGLISH", order: 3, description: "Academic study skills and introduction to IELTS tasks. ~IELTS 4.5. 8 weeks · 120 hours." },
      { title: "Level 5 — Academic English & IELTS (B1+ → lower B2)", kind: "ENGLISH", order: 4, description: "Academic reading, writing, lectures and IELTS strategies. ~IELTS 5.5. 8 weeks · 120 hours." },
    ],
  );

  const bba = await upsertProgramme(
    "bba-entrepreneurship-innovation-gen-ai",
    {
      code: "SHV-BBA-EI",
      title: "Business Administration — Entrepreneurship & Innovation Gen AI (with NUOL)",
      shortTitle: "BBA Entrepreneurship & Innovation Gen AI",
      type: "BACHELOR_PATHWAY",
      awardingBody: "National University of Laos (Bachelor's degree); St Hugh's College Vientiane (Diploma and Associate degree)",
      level: "Bachelor's degree (Diploma → Associate degree → NUOL Bachelor)",
      summary:
        "Your Bachelor's degree: 3 years on the SHV campus plus a 24-week internship, taught in Lao with English from zero to B2, and awarded by the National University of Laos. The Associate degree in Entrepreneurship & Innovation Gen AI is awarded by St Hugh's.",
      description: `## New opportunities for Lao students

A modern business degree designed for Laos, ASEAN and international progression — an international curriculum built on five pillars:

1. **Business core** — management, economics, accounting, marketing, finance, law & tax, operations, strategy
2. **Entrepreneurship** — find real problems, test with real customers, decide on evidence
3. **Generative AI** — two dedicated modules and an assessed AI task in every business subject
4. **English** — four modules to B1, then B2 in Year 3
5. **Real-world experience** — internship, venture residency and a 24-week bachelor internship

## The programme promise

For parents: a recognised degree route. For students: practical skills and international readiness.

- **Bachelor's degree from the National University of Laos** — study at SHV with academic collaboration with the NUOL
- **Learn in Lao** — an international-style programme taught in Lao, suitable for Lao students and reducing language stress
- **English to Master's readiness** — CEFR B2 target by graduation*, a foundation for employment and postgraduate study abroad

## 3-year structure: 2 + 1 + internship

Clear progression — Diploma → Associate degree → NUOL Bachelor.

- **Year 1 — Diploma:** foundations — management, economics, accounting, marketing. English. 6-week internship.
- **Year 2 — Associate degree:** finance, law & tax, operations, strategy, AI. English. 8-week venture residency.
- **Year 3+ — Top-up year taught by NUOL professors** on the St Hugh's campus. English continues.
- **6 months — 24-week internship & report defence:** real work, real evidence, final defence → Bachelor's degree.

_*The programme structure and module offerings are indicative and may be subject to change as part of the institution's academic review and quality-assurance processes._

## English: from beginner to B2

A structured language pathway running through all three years — 720 hours, including 480 hours designated for direct instruction (contact hours):

- **1st year — entry A0/A1 → target A2*:** general English ~6 h/week, ~IELTS 3.5–4.0
- **2nd year — target B1*:** business & academic English, ~IELTS 4.0–4.5
- **3rd year — target B2*:** professional and academic English, ~IELTS 5.0–5.5 — Master's application readiness

Graduates have the English level to prepare for master's degree applications abroad; specific university and country requirements may vary. SHV prepares students for Cambridge English Qualifications. _*Progress is based on participation, effort and evaluation. Target results are indicative._

## Block teaching: focused learning, visible progress

Two core subjects at a time — with English as a continuous spine throughout each 6-week block:

- **Weeks 1–4:** intensive teaching — theory, workshops, case studies, practical work in the AI lab
- **Week 5:** group projects, business lab work, coaching — selected theory periods become applied-project sessions
- **Week 6:** integration and evaluation — editing, exams, feedback; mornings dedicated to revision, presentations, practical assessments and feedback

Deep focus (only two core subjects per block — concentration without overload), early support (challenges identified and addressed within each block) and English continuity (English learning continues without interruption in every block). A sample Year 1 block week runs Monday–Friday from 09:00 to 16:15 with daily English, two module slots, guided self-study, a weekly Business/AI lab practice, module tutorial & coaching, and a weekly review / student clubs session.

## Where can graduates go?

- **Start your own business** — graduate with a business plan defended in front of a panel of experts, ready to launch as a founder or co-founder of an SME
- **Lead a family business** — bring modern management and AI tools into family businesses as the next generation of leaders
- **Build a career in various organisations** — business development · digital marketing · data analytics · banking · logistics · e-commerce · NGO · ASEAN companies
- **Progress to a Master's degree** — a Bachelor's degree from the National University plus English at B2 level, ready to apply for a master's both domestically and internationally

## Intake

The deck includes an **example** 2026–27 Year 1 academic calendar showing orientation and the start of semester 1 in early September 2026, five 6-week teaching blocks (each pairing two BEI modules with continuing English), English assessments, and a discovery internship from late May to mid-July 2027. Confirmed intake dates are published by the admissions team.

## Fees

Fees are not stated in the programme deck and are confirmed by the admissions team.`,
      studyLocation: "St Hugh's College Vientiane (all three years; Year 3 top-up taught by NUOL professors on campus)",
      whoFor: "Lao students who want a recognised business degree taught in Lao, close to home, with practical entrepreneurship, generative AI and English built in from zero.",
      durationLabel: "3 years on the SHV campus + 24-week internship (2 + 1 + internship)",
      durationMonths: 42,
      intakesJson: JSON.stringify([]),
      subjectRoutesJson: JSON.stringify(["Entrepreneurship & Innovation", "Generative AI"]),
      englishRequirement: "No prior English required — entry at A0/A1. English runs through all three years: four modules to B1, then B2 in Year 3 (targets ~IELTS 3.5–4.0 → 4.0–4.5 → 5.0–5.5; indicative).",
      assessment: "Block teaching in 6-week blocks: weeks 1–4 intensive teaching, week 5 group projects / business lab / coaching, week 6 integration and evaluation (editing, exams, feedback). An assessed AI task in every business subject. Final 24-week internship with report defence.",
      qualification: "Year 1: Diploma (St Hugh's). Year 2: Associate degree in Entrepreneurship & Innovation Gen AI (St Hugh's). Year 3 + 24-week internship: Bachelor's degree awarded by the National University of Laos.",
      progression: "Progression to a Master's degree: a Bachelor's degree from the National University plus English at B2 level, ready to apply domestically and internationally (specific university and country requirements may vary).",
      whatNext: "Start your own business; lead a family business; careers in business development, digital marketing, data analytics, banking, logistics, e-commerce, NGOs and ASEAN companies; or progress to a Master's degree.",
      applicationNotes: "Entry requirements and fees are not stated in the programme deck and are confirmed by the admissions team. The deck's 2026–27 Year 1 calendar is marked as an example (September start shown). Programme structure and modules are indicative and may change through academic review and quality assurance.",
      featured: true,
      sortOrder: 6,
      ...PUB,
      verificationStatus: "VERIFIED",
      sourceNote: `${deck("bba", "p1-2, p4, p6, p8, p10, p12, p14, p16")} — fees, entry requirements and confirmed intake are NOT stated in the deck (calendar p16 is marked EXAMPLE)`,
      ownerId: admin.id,
      effectiveDate: new Date("2026-09-01"),
      reviewDate: new Date("2027-06-01"),
      seoTitle: "Business Administration — Entrepreneurship & Innovation Gen AI (SHV + NUOL)",
      seoDescription: "A NUOL-awarded bachelor's degree taught in Lao on the St Hugh's campus: 3 years + 24-week internship, entrepreneurship, generative AI and English from zero to B2.",
    },
    [
      { title: "Year 1 — Diploma", kind: "CORE", order: 0, description: "Foundations: management, economics, accounting, marketing. English. 6-week internship." },
      { title: "Year 2 — Associate degree", kind: "CORE", order: 1, description: "Finance, law & tax, operations, strategy, AI. English. 8-week venture residency." },
      { title: "Year 3 — Top-up year taught by NUOL professors", kind: "CORE", order: 2, description: "Delivered on the St Hugh's campus. English continues." },
      { title: "24-week internship & report defence", kind: "CORE", order: 3, description: "Real work, real evidence, final defence — leading to the NUOL Bachelor's degree." },
      { title: "Generative AI", kind: "SUBJECT", order: 4, description: "Two dedicated modules plus an assessed AI task in every business subject; practical work in the AI lab." },
      { title: "Entrepreneurship", kind: "SUBJECT", order: 5, description: "Find real problems, test with real customers, decide on evidence; venture residency; business plan defended before a panel of experts." },
      { title: "English pathway (A0/A1 → B2)", kind: "ENGLISH", order: 6, description: "720 hours including 480 contact hours across three years: general English (~IELTS 3.5–4.0) → business & academic English (~4.0–4.5) → professional and academic English (~5.0–5.5). Targets indicative." },
    ],
  );

  // ── Pathways ───────────────────────────────────────────────────────────────
  await prisma.pathwayStep.deleteMany({});
  await prisma.pathway.deleteMany({});
  const ncukNet = uniBySlug["ncuk-university-partners"];
  const ncukPathNote = `[NCUK-IFY] [NCUK-IY1] ${deck("ify", "p2-3")}`;
  const vte = { lat: 17.9757, lng: 102.6331 };
  const hanoi = { lat: 21.0278, lng: 105.8342 };
  const bangkok = { lat: 13.7563, lng: 100.5018 };
  const lyon = { lat: 45.764, lng: 4.8357 };
  type StepSeed = { label: string; location?: string; institution?: string; duration?: string; description?: string; lat?: number; lng?: number };
  type PathwaySeed = {
    slug: string;
    code?: string;
    title: string;
    summary?: string;
    programmeId?: string;
    subjectArea?: string;
    destinationId?: string;
    universityId?: string;
    partnerName?: string;
    qualification?: string;
    field?: string;
    structureLabel?: string;
    totalDurationLabel?: string;
    transferPoint?: string;
    progressionRequirements?: string;
    careerDirections?: string;
    applicationNotes?: string;
    featured?: boolean;
    sortOrder?: number;
    verificationStatus?: string;
    sourceNote: string;
    status?: string;
    steps: StepSeed[];
  };
  const pathways: PathwaySeed[] = [
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
      sourceNote: ncukPathNote,
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
      sourceNote: ncukPathNote,
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
      sourceNote: ncukPathNote,
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
      sourceNote: ncukPathNote,
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
      sourceNote: "[NCUK-IFY] [NCUK-IY1]",
      steps: [
        { label: "Year 1", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "1 year", description: "NCUK International Year One — Business Management", ...vte },
        { label: "Year 2", location: "UK / Australia / New Zealand", institution: "NCUK University Partner", duration: "1 year", lat: 51.5074, lng: -0.1278 },
        { label: "Degree", location: "UK / Australia / New Zealand", institution: "NCUK University Partner", duration: "1 year", lat: 51.5074, lng: -0.1278 },
        { label: "Career", location: "Anywhere" },
      ],
    },
    {
      slug: "bachelor-2-plus-2-british-university-vietnam",
      code: "BA-IHM-2+2-VN",
      title: "2+2 → Bachelor in International Hospitality Management at British University Vietnam",
      summary: "Two years at St Hugh's College Vientiane, then two years at British University Vietnam in Hanoi to complete a British-accredited Bachelor in International Hospitality Management — from Laos to an international hospitality leader.",
      programmeId: buvProgramme.id,
      subjectArea: "Hospitality & Tourism",
      destinationId: destBySlug["vietnam"],
      universityId: uniBySlug["british-university-vietnam"],
      partnerName: "British University Vietnam",
      qualification: "Bachelor in International Hospitality Management (British University Vietnam)",
      field: "International hospitality management — F&B and rooms operations, hospitality marketing, service business strategy, management readiness",
      structureLabel: "2 + 2",
      totalDurationLabel: "4 years",
      transferPoint: "After Year 2 at SHV → Year 3 at BUV, Hanoi",
      progressionRequirements: "Successful completion of Years 1–2 at SHV. Entry standard: age 17+, IELTS 4.5 or equivalent, Mor 7 certificate + transcript.",
      careerDirections: "Management Trainee (learn the business) → Supervisor (lead a small team) → Assistant Manager (manage operations) → Department Manager (own a function) → General Manager / Entrepreneur (lead the business)",
      applicationNotes: `September start. Estimated 4-year cost 2026–27: $48.6k, or $40.9k with a 25% BUV scholarship (BUV advertises 100%, 50% and 25% scholarships for the 2026 intake). ${FEE_DISCLAIMER}`,
      featured: true,
      sortOrder: 5,
      verificationStatus: "VERIFIED",
      sourceNote: deck("buv", "p1-4, p7-10"),
      steps: [
        { label: "Year 1", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "1 year", description: "English for Higher Education, academic skills, hospitality & tourism foundation, professional etiquette", ...vte },
        { label: "Year 2", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "1 year", description: "F&B and rooms operations, people and diversity, hospitality marketing, practical service standards", ...vte },
        { label: "Year 3", location: "Hanoi, Vietnam", institution: "British University Vietnam", duration: "1 year", description: "Project management, consumer behaviour, service business strategy, industry exposure", ...hanoi },
        { label: "Year 4", location: "Hanoi, Vietnam", institution: "British University Vietnam", duration: "1 year", description: "Career development, capstone / applied project, management readiness, professional network — Bachelor's degree awarded by BUV", ...hanoi },
        { label: "Career", location: "Anywhere", description: "From Management Trainee to General Manager / Entrepreneur" },
      ],
    },
    {
      slug: "bachelor-master-1-plus-3-assumption-university",
      code: "BA-MA-1+3-TH",
      title: "1+3 → Bachelor's and Master's at Assumption University, Bangkok",
      summary: "One year at St Hugh's College Vientiane, then three years at Assumption University in Bangkok — two degrees (a Bachelor's and a Master's, SIMBA) in four years, with the first year at home.",
      programmeId: auProgramme.id,
      subjectArea: "Business",
      destinationId: destBySlug["thailand"],
      universityId: uniBySlug["assumption-university"],
      partnerName: "Assumption University of Thailand",
      qualification: "Bachelor's degree + Master's degree (Assumption University)",
      field: "SIMBA — Smart Integration in Management & Business Analytics",
      structureLabel: "1 + 3",
      totalDurationLabel: "4 years — 2 degrees",
      transferPoint: "After Year 1 at SHV → Assumption University, Bangkok",
      progressionRequirements: "Successful completion of Year 1 at SHV (academic English & presentation, business foundations, digital business & AI literacy, quantitative / analytics readiness, study skills). Detailed progression criteria are confirmed by the admissions team.",
      careerDirections: "Entrepreneur, analyst, manager, marketer, family business successor, ASEAN professional",
      applicationNotes: `Estimated 4-year cost 2026–27: $54k — tuition of $27,000 payable within the three Assumption University years plus living expenses of $9k per year in Bangkok. ${FEE_DISCLAIMER}`,
      featured: true,
      sortOrder: 6,
      verificationStatus: "VERIFIED",
      sourceNote: deck("au", "p1, p3-6, p8, p10"),
      steps: [
        { label: "Year 1", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "1 year", description: "Academic English & presentation, business foundations, digital business & AI literacy, quantitative / analytics readiness, study skills & mentoring", ...vte },
        { label: "Years 2–3", location: "Bangkok, Thailand", institution: "Assumption University", duration: "2 years", description: "Bachelor's major — management & strategy, marketing and communication, sustainable business / entrepreneurship, data analytics & applied informatics, international business projects", ...bangkok },
        { label: "Year 4", location: "Bangkok, Thailand", institution: "Assumption University", duration: "1 year", description: "Master's — business & advanced technology management, leadership, innovation and change, business analytics / digital transformation, research or capstone, industry practice", ...bangkok },
        { label: "Career", location: "ASEAN and beyond", description: "Entrepreneur, analyst, manager, marketer, family business successor, ASEAN professional" },
      ],
    },
    {
      slug: "bachelor-1-plus-3-esdes-lyon",
      code: "BA-IB-1+3-FR",
      title: "1+3 → Bachelor in International Business at ESDES Business School, Lyon",
      summary: "The NCUK International Foundation Year at St Hugh's, then three years at ESDES Business School in Lyon, France, for a Bachelor in International Business taught 100% in English — with four months abroad and paid internships.",
      programmeId: esdesProgramme.id,
      subjectArea: "Business",
      destinationId: destBySlug["france"],
      universityId: uniBySlug["esdes-lyon-business-school"],
      partnerName: "ESDES Business School (UCLY)",
      qualification: "Bachelor in International Business (ESDES Business School, Lyon)",
      field: "International business",
      structureLabel: "1 + 3",
      totalDurationLabel: "4 years",
      transferPoint: "After the NCUK IFY at SHV → Year 1 at ESDES, Lyon",
      progressionRequirements: "Successful completion of the NCUK International Foundation Year at SHV. Merit scholarships of up to 30% for the first ESDES year may be awarded for outstanding achievement (e.g. NCUK IFY average of 75% or above; Lao Mor 7 GPA 8.5–10 with strong grades in relevant subjects).",
      careerDirections: "International business careers; paid internships during study (mandatory compensation for internships over two months); students may work up to 20 hours per week in France",
      applicationNotes: `Estimated 4-year cost 2026–27: $83k — IFY $14k + three years of $10.5k tuition and $12k living in Lyon. 10% early-bird discount on the first ESDES year when paid five months before intake. Fees at ESDES are for illustration only (1€ = $1.1386). ${FEE_DISCLAIMER}`,
      featured: true,
      sortOrder: 7,
      verificationStatus: "VERIFIED",
      sourceNote: deck("esdes", "p1-5, p8-10"),
      steps: [
        { label: "Year 1 (IFY)", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "1 year", description: "NCUK International Foundation Year — build the skills to begin your international journey", ...vte },
        { label: "Year 2 (ESDES Year 1)", location: "Lyon, France", institution: "ESDES Business School", duration: "1 year", description: "Build strong business foundations", ...lyon },
        { label: "Year 3 (ESDES Year 2)", location: "Lyon, France + 4 months abroad", institution: "ESDES Business School", duration: "1 year", description: "Expand your skills and experience the world — four months at a partner campus in Greece, Argentina, Morocco, Vietnam, the USA, Poland, Italy, the UK, Hungary, Uruguay or Brazil", ...lyon },
        { label: "Year 4 (ESDES Year 3)", location: "Lyon, France", institution: "ESDES Business School", duration: "1 year", description: "Specialise and prepare for your career — Bachelor in International Business awarded", ...lyon },
        { label: "Career", location: "Europe, Asia and beyond", description: "International business, with paid internship experience from France" },
      ],
    },
    {
      slug: "bba-entrepreneurship-innovation-nuol",
      code: "BBA-EI-LA",
      title: "Diploma → Associate degree → NUOL Bachelor's, all on the SHV campus",
      summary: "Three years on the St Hugh's campus plus a 24-week internship, taught in Lao with English from zero to B2: a Diploma, then an Associate degree in Entrepreneurship & Innovation Gen AI, then a Bachelor's degree awarded by the National University of Laos.",
      programmeId: bba.id,
      subjectArea: "Business",
      destinationId: destBySlug["laos"],
      universityId: uniBySlug["national-university-of-laos"],
      partnerName: "National University of Laos",
      qualification: "Bachelor's degree (National University of Laos); Associate degree in Entrepreneurship & Innovation Gen AI (St Hugh's)",
      field: "Business administration, entrepreneurship, generative AI",
      structureLabel: "2 + 1 + internship",
      totalDurationLabel: "3 years + 24-week internship",
      transferPoint: "No transfer — the Year 3 top-up is taught by NUOL professors on the St Hugh's campus",
      progressionRequirements: "Progression through the Diploma (Year 1) and Associate degree (Year 2) to the NUOL top-up year and the 24-week internship with report defence. Structure and modules are indicative and may change through academic review and quality assurance.",
      careerDirections: "Founder / co-founder of an SME; next-generation leader of a family business; business development, digital marketing, data analytics, banking, logistics, e-commerce, NGOs, ASEAN companies; progression to a Master's degree",
      applicationNotes: "Entry requirements, fees and confirmed intake dates are not stated in the programme deck and are confirmed by the admissions team.",
      featured: true,
      sortOrder: 8,
      verificationStatus: "VERIFIED",
      sourceNote: deck("bba", "p1, p6, p8, p12"),
      steps: [
        { label: "Year 1 — Diploma", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "1 year", description: "Management, economics, accounting, marketing; English; 6-week internship", ...vte },
        { label: "Year 2 — Associate degree", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "1 year", description: "Finance, law & tax, operations, strategy, AI; English; 8-week venture residency", ...vte },
        { label: "Year 3 — NUOL top-up", location: "Vientiane, Lao PDR", institution: "National University of Laos professors on the SHV campus", duration: "1 year", description: "Top-up year taught by NUOL professors; English continues", ...vte },
        { label: "Internship", location: "Laos", duration: "24 weeks", description: "Internship and report defence — real work, real evidence, final defence → NUOL Bachelor's degree", ...vte },
        { label: "Career or Master's", location: "Laos, ASEAN and abroad", description: "Start a business, lead a family business, join an organisation, or apply for a Master's with B2 English" },
      ],
    },
    {
      slug: "intensive-english-to-university-pathway",
      code: "IEP-IFY",
      title: "Intensive English → IELTS 5.5 readiness → university pathway",
      summary: "From zero or low English to university-entry readiness in up to five 8-week levels, then into an SHV pathway programme such as the NCUK International Foundation Year and a bachelor's degree abroad.",
      programmeId: iep.id,
      subjectArea: "English",
      qualification: "SHV Certificate of Completion per level, then entry to a pathway programme",
      field: "English language — general, everyday, independent and academic English with IELTS strategies",
      structureLabel: "Up to 40 weeks + 1 + 3",
      totalDurationLabel: "Up to 40 weeks of English, then a pathway programme",
      transferPoint: "After Level 5 (lower B2, ~IELTS 5.5) → NCUK International Foundation Year or another SHV pathway",
      progressionRequirements: "A placement assessment sets the starting level; students move to the next level when the end-level assessment shows they are academically ready. After Level 5 students can prepare for IELTS Academic 5.5 and begin university pathway study.",
      applicationNotes: "$995 per 8-week level, all-inclusive (120 classroom hours, Cambridge English Student's Book with Digital Pack, Cambridge One access, assessments, guided ICT-room self-study, SHV Certificate of Completion).",
      featured: false,
      sortOrder: 9,
      verificationStatus: "VERIFIED",
      sourceNote: `${deck("iep", "p1, p3, p6-8")} ${deck("ify", "p5")}`,
      steps: [
        { label: "Levels 1–2", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "16 weeks", description: "English Foundations and Everyday English (A0 → A2): introduce yourself, ask questions, communicate in daily situations", ...vte },
        { label: "Levels 3–4", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "16 weeks", description: "Independent English I & II (A2 → B1+): longer speaking, organised paragraphs, academic study skills, introduction to IELTS tasks", ...vte },
        { label: "Level 5", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "8 weeks", description: "Academic English & IELTS (B1+ → lower B2, ~IELTS 5.5)", ...vte },
        { label: "Pathway programme", location: "Vientiane, Lao PDR", institution: "St Hugh's College Vientiane", duration: "1 year", description: "e.g. NCUK International Foundation Year (IELTS 5.5 or equivalent at SHV)", ...vte },
        { label: "Bachelor abroad", location: "Worldwide", duration: "3 years", description: "Progression to a partner university" },
      ],
    },
  ];
  const pathwayIdBySlug: Record<string, string> = {};
  for (const p of pathways) {
    const { steps, status, ...data } = p;
    const row = await prisma.pathway.create({
      data: {
        ...data,
        status: status ?? "PUBLISHED",
        ownerId: admin.id,
        steps: { create: steps.map((s, i) => ({ ...s, order: i })) },
      },
    });
    pathwayIdBySlug[p.slug] = row.id;
  }

  // ── Student stories (DRAFT until consent is recorded — never published automatically) ──
  const stories = [
    {
      slug: "vanhnaphone-bounnapol",
      studentName: "Vanhnaphone Bounnapol",
      programmeId: ify.id,
      pathwayId: pathwayIdBySlug["bachelor-1-plus-3-esdes-lyon"],
      journey: "Shown in SHV's ESDES pathway deck as a St Hugh's International Foundation Year graduate (2026) alongside the ESDES Business School logo. Story text, quote and progression evidence to be supplied by SHV once the student's consent is recorded.",
      destinationId: destBySlug["france"],
      universityId: uniBySlug["esdes-lyon-business-school"],
      outcome: "St Hugh's International Foundation Year, 2026",
      consentStatus: "PENDING",
      featured: false,
      status: "DRAFT",
      verificationStatus: "PENDING",
    },
    {
      slug: "namnueng",
      studentName: "Namnueng",
      programmeId: ify.id,
      journey: "Video testimonial still captioned \"Namnueng\" in SHV's NCUK IFY deck (p8). Full name, programme, story and consent to be confirmed by SHV before publication.",
      consentStatus: "PENDING",
      featured: false,
      status: "DRAFT",
      verificationStatus: "PENDING",
    },
  ];
  for (const s of stories) await prisma.studentStory.upsert({ where: { slug: s.slug }, update: s, create: s });

  // ── Documents (digital prospectus — the six official 2026–27 programme decks) ──
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const documents = [
    { slug: "ncuk-international-foundation-year-pathway-1-plus-3-2026-27", key: "ify", title: "NCUK International Foundation Year — Bachelor's degree Pathway (1+3)", description: "Official SHV programme deck: the 1+3 pathway, what you study in 9 months in Vientiane, who can apply, progression destinations and the 2026–27 cost comparison." },
    { slug: "intensive-english-programme-2026-27", key: "iep", title: "Intensive English Programme — English starts here", description: "Official SHV programme deck: five 8-week levels from A0 to lower B2, daily lesson structure, Cambridge-supported learning, assessment and the $995 all-inclusive level fee." },
    { slug: "buv-international-hospitality-management-2-plus-2-2026-27", key: "buv", title: "Bachelor in International Hospitality Management — 2+2 with British University Vietnam", description: "Official SHV programme deck: year-by-year content, the hospitality career ladder, who can apply, September start and the 2026–27 estimated cost of study (with and without a 25% BUV scholarship)." },
    { slug: "assumption-university-bachelor-master-1-plus-3-2026-27", key: "au", title: "Bachelor's + Master's Pathway (1+3) with Assumption University — SIMBA", description: "Official SHV programme deck: two degrees in four years, SIMBA (Smart Integration in Management & Business Analytics), the four-year plan and the 2026–27 estimated cost of study." },
    { slug: "esdes-bachelor-international-business-1-plus-3-2026-27", key: "esdes", title: "Bachelor in International Business — 1+3 with ESDES Business School, Lyon", description: "Official SHV programme deck (Lao/English): the 1+3 pathway, four months abroad, paid internships and benefits of studying in France, scholarships and the 2026–27 estimated cost of study." },
    { slug: "bba-entrepreneurship-innovation-gen-ai-nuol-2026-27", key: "bba", title: "Business Administration — Entrepreneurship & Innovation Gen AI (SHV + NUOL)", description: "Official SHV programme deck (Lao/English): the 2 + 1 + internship structure, English from beginner to B2, block teaching, graduate destinations and an example Year 1 calendar." },
  ];
  for (const d of documents) {
    const data = {
      title: d.title,
      slug: d.slug,
      category: "BROCHURE",
      description: d.description,
      version: "2026-27",
      documentDate: today,
      visibility: "PUBLIC",
      status: "PUBLISHED",
      mediaId: deckMediaId[d.key],
    };
    await prisma.document.upsert({ where: { slug: d.slug }, update: data, create: data });
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
  const facilityPhoto: Record<string, string> = { "campus-entrance": photo.entrance, classrooms: photo.class1, "smart-classroom": photo.teacher };
  for (const f of facilities) {
    const photoMediaId = facilityPhoto[f.slug] ?? null;
    await prisma.facility.upsert({ where: { slug: f.slug }, update: { photoMediaId }, create: { ...f, ...PUB, photoMediaId } });
  }

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
    ["PROGRAMMES", "What is the NCUK International Foundation Year?", "A pre-university programme delivered at St Hugh's College Vientiane, an NCUK Study Centre, and quality-assured by NCUK. It is SHV's Bachelor's degree Pathway (1+3): Mor 7 graduates study at least five modules (for example Business, Economics, English for Academic Purposes, Global Studies, Integrated Math and a skills-based module) for nine months in Vientiane, then progress to three years of a bachelor's degree abroad.", "ncuk-international-foundation-year"],
    ["PROGRAMMES", "What is the NCUK International Year One?", "A credit-bearing programme equivalent to the first year of a university degree. SHV offers the Business Management route. Students who complete it can progress directly into Year 2 at NCUK University Partners.", "ncuk-international-year-one-business-management"],
    ["PROGRAMMES", "What is the 2+2 route with British University Vietnam?", "The Bachelor in International Hospitality Management: two years at SHV in Vientiane (English for Higher Education, academic skills, hospitality foundations, F&B and rooms operations, hospitality marketing) followed by two years at British University Vietnam in Hanoi (project management, service business strategy, career development, capstone). BUV is British-accredited with British Quality Assurance accreditation. Entry: age 17+, IELTS 4.5 or equivalent, Mor 7 certificate and transcript; September start.", "bachelor-international-hospitality-management"],
    ["PROGRAMMES", "Can I really get a Master's degree in 4 years?", "Yes — through the 1+3 pathway with Assumption University, Bangkok. Year 1 is taught at St Hugh's College Vientiane; Years 2–3 are the Bachelor's major and Year 4 is the Master's-level year at Assumption University, which awards both degrees. The programme is SIMBA — Smart Integration in Management & Business Analytics. The deck compares this with 6+ years on the traditional route.", "bachelor-master-pathway-assumption-university"],
    ["PROGRAMMES", "What are the Intensive English levels?", "Five 8-week levels of 120 hours each (3 hours a day, 5 days a week): Level 1 English Foundations (A0 → A1, ~IELTS 3.0), Level 2 Everyday English (A1 → A2, ~IELTS 3.5–4.0), Level 3 Independent English I (A2 → lower B1, ~IELTS 4.0–4.5), Level 4 Independent English II (lower B1 → B1+, ~IELTS 4.5) and Level 5 Academic English & IELTS (B1+ → lower B2, ~IELTS 5.5). Complete beginners normally need up to 40 weeks to reach IELTS 5.5 readiness.", "intensive-english-programme"],
    ["PROGRAMMES", "How do I know which Intensive English level to start at?", "Entry is based on a placement assessment, so you start at the correct level — students with some English may start above Level 1. Progress is monitored with a mid-course review, an end-level assessment and progress feedback for students and parents. Students move forward when they are academically ready.", "intensive-english-programme"],
    ["ENGLISH", "Do I need IELTS to start?", "Not for every programme. The Intensive English Programme starts from complete beginner (A0) and takes students to lower B2, ready to prepare for IELTS Academic 5.5 and begin university pathway study. The BBA in Entrepreneurship & Innovation Gen AI is taught in Lao and builds English from zero to B2 over three years. For the NCUK International Foundation Year SHV asks for IELTS 5.5 or equivalent, and for the 2+2 with British University Vietnam IELTS 4.5 or equivalent."],
    ["ENGLISH", "What English level do I need?", "NCUK International Foundation Year at SHV: IELTS 5.5 or equivalent (NCUK's network minimum is 5.0). NCUK International Year One: IELTS 5.5 or equivalent. 2+2 with British University Vietnam: IELTS 4.5 or equivalent. Intensive English and the BBA with NUOL: no prior English required. NCUK programmes include English for Academic Purposes, which NCUK University Partners accept in place of IELTS for progression."],
    ["PROGRESSION", "Is university progression guaranteed?", "NCUK states that International Foundation Year students have \"Guaranteed* entry to one of 80+ NCUK University Partners worldwide\", and that International Year One students receive guaranteed entry to Year 2 at NCUK University Partners. The asterisk matters: entry depends on meeting the grades and English requirements published for the specific course, and on NCUK's conditions. For the direct partner routes (BUV, Assumption University, ESDES), progression depends on successful completion of the SHV years. Our advisors will explain exactly what applies to your chosen route."],
    ["PROGRESSION", "Where can I go after the Foundation Year?", "SHV's IFY deck maps progression destinations in the United Kingdom, Australia, New Zealand, the United States, Canada, France (ESDES Business School), Vietnam (British University Vietnam, RMIT Vietnam), Malaysia (University of Nottingham Malaysia, Southampton Malaysia, Newcastle Medicine Malaysia, Swinburne Sarawak, Reading Malaysia) and Thailand (Assumption University).", "ncuk-international-foundation-year"],
    ["PATHWAYS", "Can I complete a whole bachelor's degree in Laos?", "Yes. The Business Administration degree in Entrepreneurship & Innovation Gen AI is taught in Lao on the SHV campus over three years plus a 24-week internship — Diploma (Year 1), Associate degree (Year 2, awarded by St Hugh's) and a top-up year taught by NUOL professors — with the Bachelor's degree awarded by the National University of Laos. Our other bachelor routes are completed with partner universities abroad through 1+3 or 2+2 structures.", "bba-entrepreneurship-innovation-gen-ai"],
    ["ADMISSIONS", "How do I apply?", "Start with a free consultation. An advisor will check your qualifications and English level against the entry requirements, help you choose a route, and guide you through the application step by step."],
    ["ADMISSIONS", "Is the consultation free?", "Yes. There is no consultation fee. You receive programme guidance, an entry-requirement checklist and a clear next-step plan."],
    ["INTERNATIONAL", "Can students from outside Laos study at SHV?", "SHV welcomes enquiries from international students. Visa and residence requirements are set by the Lao authorities, so we link to official sources and help you understand the process rather than offering immigration advice."],
    ["FEES", "How much does it cost?", "Each programme page publishes SHV's estimated cost of study for 2026–27 under \"Estimated cost of study 2026–27\", exactly as shown in the official programme decks: for example the Intensive English Programme is $995 per 8-week level all-inclusive; the 2+2 with British University Vietnam is estimated at $48.6k over four years ($40.9k with a 25% BUV scholarship); the 1+3 with Assumption University at $54k; and the 1+3 with ESDES at $83k. These are estimates — partner fees are for illustration only and may change — and the exact tuition, application, registration and uniform fees are confirmed by the admissions team for each intake. The programme decks can be downloaded from the Resources page."],
    ["FEES", "What is included in the Intensive English fee?", "$995 per 8-week level covers 120 classroom hours, the Cambridge English Student's Book with Digital Pack, individual Cambridge One digital access, assessments and progress feedback, guided ICT-room self-study and an SHV Certificate of Completion.", "intensive-english-programme"],
    ["FEES", "Are scholarships available?", "British University Vietnam advertises scholarships of 100%, 50% and 25% for the 2026 intake of the 2+2 route. ESDES Business School may award merit scholarships of up to 30% for the first year in Lyon (for example an NCUK IFY average of 75% or above, or Lao Mor 7 GPA 8.5–10) and offers a 10% early-bird discount on the first year when payment is made five months before intake. Award criteria are set by the partner universities."],
    ["CAMPUS", "Where is the campus?", "Nonsavanh Village, Xaysetha District, Vientiane Capital, Lao PDR. The campus has nine classrooms, two lecture halls, a library and an ICT room. Call +856 20 58 814 648 or email admissions@sthughs.edu.la."],
    ["APPLICATIONS", "When are the intakes?", "The NCUK International Foundation Year, the International Year One and the 2+2 with British University Vietnam start in September. Intake dates for the other programmes, and start dates for each Intensive English level, are confirmed by the admissions team and shown on the programme page."],
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

  // Partnership signing — DRAFT: the deck shows the signing photo but not the date; SHV adds publishedAt.
  const auNews = {
    title: "St Hugh's College Vientiane signs pathway partnership with Assumption University",
    excerpt: "SHV and Assumption University of Thailand have signed a partnership for a 1+3 pathway: one year in Vientiane, three years in Bangkok, and both a Bachelor's and a Master's degree in four years.",
    body: `St Hugh's College Vientiane (SHV) and Assumption University of Thailand have signed a partnership agreement for a 1+3 pathway: one year at St Hugh's College Vientiane followed by three years at Assumption University in Bangkok.

Students on the route graduate with two degrees — a Bachelor's and a Master's from Assumption University — in four years in total, with Year 1 taught at St Hugh's College, close to family. The programme is SIMBA, Smart Integration in Management & Business Analytics, which combines business theory with technological expertise so students can create practical solutions for digital industries.

Assumption University is one of Thailand's most established private international universities, with modern campuses, an international community and global partner universities, and awards both the Bachelor's and the Master's degree. St Hugh's College Vientiane, part of the Panyathip group, offers small classes and personal academic mentoring, is experienced in preparing Lao students for international universities, and remains the student's local point of contact for all four years.

_Date of signing to be confirmed by SHV before publication. Source: [DECK 4b. Assumption 1+3 Master vENG.pdf p4-5]._`,
    category: "PARTNERSHIPS",
    authorName: "SHV Communications",
    heroMediaId: photo.auSigning,
    relatedProgrammeId: auProgramme.id,
    relatedUniversityId: uniBySlug["assumption-university"],
    tagsJson: JSON.stringify(["Assumption University", "Partnerships", "Thailand"]),
    seoDescription: "SHV and Assumption University sign a 1+3 pathway partnership: a Bachelor's and a Master's in four years, starting in Vientiane.",
    status: "DRAFT",
  };
  await prisma.newsArticle.upsert({
    where: { slug: "shv-signs-pathway-partnership-with-assumption-university" },
    update: auNews,
    create: { slug: "shv-signs-pathway-partnership-with-assumption-university", ...auNews },
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

SHV's 2026–27 programme decks add direct pathway partnerships with British University Vietnam (2+2 Bachelor in International Hospitality Management), Assumption University of Thailand (1+3 Bachelor's + Master's, SIMBA) and ESDES Business School in Lyon (1+3 Bachelor in International Business), an academic collaboration with the National University of Laos for a bachelor's degree in Entrepreneurship & Innovation Gen AI taught on the SHV campus, and an Intensive English Programme with Cambridge English materials.

The founder of SHV is the principal owner of Panyathip British International School (PBIS), established in Vientiane in 2001 and a member of FOBISIA and COBIS; SHV is part of the Panyathip group. That relationship gives SHV two decades of experience in British-curriculum education in Laos to draw on.

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

Start close to home. A foundation or first year in Vientiane means lower relocation cost, family proximity and time to build academic English before moving abroad. SHV's IFY deck puts one year of tuition at SHV at $14k against $54k–$60k for tuition and living in the UK, Singapore, Australia or New Zealand (2026–27 estimates, for illustration only).

## Why SHV

- **International programmes** — NCUK International Foundation Year and International Year One, quality-assured by NCUK.
- **Direct partner routes** — 2+2 with British University Vietnam, 1+3 Bachelor's + Master's with Assumption University, 1+3 with ESDES Business School in Lyon, and a NUOL-awarded bachelor's degree taught on campus.
- **Authorised** — full authorisation from the Lao Ministry of Education and Sports (late 2023) for programmes up to Level 5.
- **Support** — small classes, personal academic mentoring, and English built into every route — from the Intensive English Programme (A0 to lower B2) to English for Academic Purposes.
- **Employability focus** — internships, venture residencies, career ladders and capstone projects built into the programmes.

## Why global

NCUK qualifications are recognised by NCUK University Partners in the UK, Australia, New Zealand, the USA, Canada and Malaysia. SHV's direct partnerships extend the map to Hanoi, Bangkok and Lyon — and the BBA with NUOL lets students complete a recognised degree without leaving Vientiane.` } },
        { type: "PROGRAMME_GRID", data: { title: "Programmes", featuredOnly: true } },
        { type: "CTA", data: { title: "See where your route could lead", primaryLabel: "Explore your pathway", primaryHref: "/pathway-explorer", secondaryLabel: "Talk to an advisor", secondaryHref: "/consultation" } },
      ],
    },
    { slug: "privacy", title: "Privacy policy", seoDescription: "How St Hugh's College Vientiane handles personal data.", blocks: [{ type: "RICH_TEXT", data: { body: "## Privacy policy\n\nThis policy is maintained by SHV in the content management system. It should describe what personal data is collected through enquiry and consultation forms, how it is used, how long it is kept, and how to request access or deletion.\n\n_Draft — to be reviewed and approved by SHV before launch._" } }] },
    { slug: "cookies", title: "Cookie policy", seoDescription: "How this website uses cookies and similar technologies.", blocks: [{ type: "RICH_TEXT", data: { body: "## Cookie policy\n\nThis website uses strictly necessary cookies for staff sign-in and first-party, anonymous analytics stored in your browser's session storage. If you choose a language from the Language menu, a `googtrans` cookie stores your choice and Google Translate is loaded to translate the page; English is the official version. No third-party advertising cookies are set.\n\n_Draft — to be reviewed and approved by SHV before launch._" } }] },
    { slug: "terms", title: "Terms of use", seoDescription: "Terms of use for the St Hugh's College Vientiane website.", blocks: [{ type: "RICH_TEXT", data: { body: "## Terms of use\n\nInformation on this website is provided for guidance. Programme availability, entry requirements, fees and partner arrangements are confirmed in writing by the admissions team. Estimated costs of study are reproduced from SHV's 2026–27 programme decks; partner fees are for illustration only and may change.\n\n_Draft — to be reviewed and approved by SHV before launch._" } }] },
    { slug: "accessibility", title: "Accessibility statement", seoDescription: "Our commitment to an accessible website.", blocks: [{ type: "RICH_TEXT", data: { body: "## Accessibility statement\n\nWe aim to meet WCAG 2.2 AA. The site supports keyboard navigation, visible focus, screen readers and reduced-motion preferences. If you find a barrier, contact us and we will fix it.\n\n_Draft — to be reviewed and approved by SHV before launch._" } }] },
  ];
  // Seed-managed pages are replaced wholesale so a re-seed always reflects the current decks.
  for (const p of pages) {
    const blocks = p.blocks.map((b, idx) => ({ type: b.type, order: idx, dataJson: JSON.stringify(b.data) }));
    const existing = await prisma.page.findUnique({ where: { slug: p.slug } });
    if (existing) {
      await prisma.contentBlock.deleteMany({ where: { pageId: existing.id } });
      await prisma.page.update({ where: { id: existing.id }, data: { title: p.title, seoDescription: p.seoDescription, ...PUB, blocks: { create: blocks } } });
    } else {
      await prisma.page.create({ data: { slug: p.slug, title: p.title, seoDescription: p.seoDescription, ...PUB, blocks: { create: blocks } } });
    }
  }

  // ── Campaign example (attribution) ────────────────────────────────────────
  await prisma.campaign.upsert({
    where: { utmCampaign: "sept-intake" },
    update: {},
    create: { name: "September intake awareness", utmSource: "facebook", utmMedium: "social", utmCampaign: "sept-intake", landingPage: "/programmes" },
  });

  const counts = {
    programmes: await prisma.programme.count(),
    pathways: await prisma.pathway.count(),
    universities: await prisma.university.count(),
    destinations: await prisma.destination.count(),
    partners: await prisma.partner.count(),
    documents: await prisma.document.count(),
    media: await prisma.media.count(),
    faqs: await prisma.faq.count(),
  };

  // ── Milestones (public record only; shown on the homepage timeline) ─────
  await prisma.siteSetting.upsert({
    where: { key: "milestones" },
    update: {},
    create: {
      key: "milestones",
      valueJson: JSON.stringify({
        items: [
          { year: "2001", label: "Panyathip British International School opens in Vientiane", detail: "Founded by the principal owner who later established St Hugh's College Vientiane. PBIS is a member of FOBISIA and COBIS.", sourceNote: "[NCUK-NEWS]" },
          { year: "2023", label: "St Hugh's College Vientiane is established and authorised", detail: "Full authorisation from the Lao Ministry of Education and Sports, late 2023, to provide programmes up to Level 5.", sourceNote: "[NCUK-SHV]" },
          { year: "2025", label: "NCUK announces SHV as an NCUK Study Centre", detail: "28 February 2025. The International Foundation Year and International Year One in Business Management are offered from September 2025.", sourceNote: "[NCUK-NEWS]" },
          { year: "2025", label: "First NCUK cohort begins in Vientiane", detail: "September 2025 intake for the International Foundation Year and International Year One.", sourceNote: "[NCUK-NEWS]" },
          { year: "2026", label: "Partner routes published for the 2026–27 intake", detail: "2+2 with British University Vietnam, 1+3 with Assumption University and 1+3 with ESDES Business School, Lyon.", sourceNote: "[DECK 3, 4b, 5]" },
        ],
      }),
    },
  });

  console.log("Seed complete.", counts);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
