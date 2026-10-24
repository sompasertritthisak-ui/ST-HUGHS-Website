import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { FAQ_CATEGORY_LABELS, PROGRAMME_TYPE_LABELS, type FaqCategory, type ProgrammeType } from "@/lib/enums";
import { excerpt, rank, type SearchDoc, type SearchHit } from "./core";

/** Fixed site pages, with the words people actually type to find them. */
const STATIC_PAGES: SearchDoc[] = [
  { kind: "page", title: "About St Hugh's", href: "/about", summary: "Who we are, our authorisation and our people.", keywords: "about us history mission leadership team ministry authorised ncuk study centre" },
  { kind: "page", title: "Why St Hugh's", href: "/why-st-hughs", summary: "What makes studying here different.", keywords: "why choose benefits reasons" },
  { kind: "page", title: "Admissions", href: "/admissions", summary: "How to apply, step by step.", keywords: "apply application how to apply entry requirements documents deadline intake enrol enrolment register" },
  { kind: "page", title: "Programmes", href: "/programmes", summary: "Foundation, Year One, bachelor pathways and Intensive English.", keywords: "courses programs study options foundation year one bachelor degree english" },
  { kind: "page", title: "Pathways", href: "/pathways", summary: "Routes from Vientiane to universities worldwide.", keywords: "routes progression study abroad 2+2 1+3 transfer" },
  { kind: "page", title: "Pathway explorer", href: "/pathway-explorer", summary: "See every route from Vientiane on one map.", keywords: "explore map routes interactive" },
  { kind: "page", title: "Check your eligibility", href: "/pathway-finder", summary: "Answer a few questions and see which routes fit you.", keywords: "eligibility eligible finder quiz match grades requirements am i eligible" },
  { kind: "page", title: "Compare pathways", href: "/compare", summary: "Put routes side by side.", keywords: "compare comparison difference versus vs" },
  { kind: "page", title: "Universities", href: "/universities", summary: "Partner and network universities.", keywords: "partners university list ncuk network" },
  { kind: "page", title: "Destinations", href: "/destinations", summary: "Countries SHV pathways lead to.", keywords: "countries study abroad uk australia vietnam thailand france" },
  { kind: "page", title: "Student life", href: "/student-life", summary: "Learning, community and campus life.", keywords: "clubs activities events community life" },
  { kind: "page", title: "Campus", href: "/campus", summary: "Our classrooms and facilities in Vientiane.", keywords: "campus facilities location classrooms library visit address map" },
  { kind: "page", title: "Student stories", href: "/student-stories", summary: "Hear from our students and alumni.", keywords: "alumni testimonials graduates stories reviews video" },
  { kind: "page", title: "News", href: "/news", summary: "Announcements and insights.", keywords: "news updates announcements blog" },
  { kind: "page", title: "Frequently asked questions", href: "/faqs", summary: "Quick answers about admissions, fees and study.", keywords: "faq faqs questions help answers" },
  { kind: "page", title: "Resources and downloads", href: "/resources", summary: "Brochures, prospectus and forms.", keywords: "download brochure prospectus pdf forms documents handbook calendar" },
  { kind: "page", title: "Scholarships", href: "/scholarships", summary: "Scholarships and discounts from NCUK partners, BUV and ESDES, and BBA payment options.", keywords: "scholarship scholarships discount financial aid funding bursary award cheaper cost help pay" },
  { kind: "page", title: "Short courses", href: "/enquire?topic=short-courses", summary: "Bartending, barista skills, etiquette and Speak like a TED talk.", keywords: "short course courses bartending bartender barista coffee etiquette manners public speaking ted talk presentation skills" },
  { kind: "page", title: "Book a tour", href: "/enquire?type=visit", summary: "Visit the campus in Vientiane.", keywords: "tour visit campus open day appointment" },
  { kind: "page", title: "Talk to an advisor", href: "/consultation", summary: "Book a free consultation with our admissions team.", keywords: "advisor adviser consultation counselling counselor meeting appointment call help" },
  { kind: "page", title: "Contact us", href: "/contact", summary: "Phone, email, WhatsApp and address.", keywords: "contact phone email whatsapp address location map telephone" },
  { kind: "page", title: "Make an enquiry", href: "/enquire", summary: "Ask us anything.", keywords: "enquiry enquire inquiry question form" },
  { kind: "page", title: "International students", href: "/international-students", summary: "Studying at SHV from outside Laos.", keywords: "international foreign visa overseas" },
  { kind: "page", title: "Work with us", href: "/work-with-us", summary: "Teaching and staff opportunities at SHV.", keywords: "jobs careers vacancies teach teacher employment hiring work" },
  { kind: "page", title: "Careers after graduation", href: "/careers", summary: "Where our graduates go next.", keywords: "career employability jobs graduates outcomes" },
  { kind: "page", title: "For parents", href: "/for/parents", summary: "What families need to know.", keywords: "parents family guardians" },
  { kind: "page", title: "For students", href: "/for/students", summary: "Your first steps as a student.", keywords: "students school leavers" },
  { kind: "page", title: "For employers", href: "/for/employers", summary: "Partner with SHV on talent and training.", keywords: "employers business companies" },
  { kind: "page", title: "For partners", href: "/for/partners", summary: "Universities and schools working with SHV.", keywords: "partners schools universities agents" },
];

async function buildIndex(): Promise<SearchDoc[]> {
  const published = { status: "PUBLISHED" } as const;
  const [programmes, pathways, destinations, universities, faqs, news, events, stories, documents] = await Promise.all([
    prisma.programme.findMany({ where: published, select: { slug: true, title: true, shortTitle: true, code: true, type: true, awardingBody: true, summary: true, qualification: true, durationLabel: true } }),
    prisma.pathway.findMany({
      where: published,
      select: { slug: true, title: true, summary: true, subjectArea: true, field: true, structureLabel: true, qualification: true, destination: { select: { country: true } }, university: { select: { name: true } } },
    }),
    prisma.destination.findMany({ where: published, select: { slug: true, country: true, isoCode: true, region: true, summary: true } }),
    prisma.university.findMany({ where: published, select: { slug: true, name: true, city: true, summary: true, programmesOffered: true, destination: { select: { country: true } } } }),
    prisma.faq.findMany({ where: published, select: { id: true, question: true, answer: true, category: true } }),
    prisma.newsArticle.findMany({ where: { ...published, visibility: "PUBLIC" }, select: { slug: true, title: true, excerpt: true, body: true, category: true } }),
    prisma.event.findMany({ where: published, select: { slug: true, title: true, description: true, location: true } }),
    prisma.studentStory.findMany({ where: { ...published, consentStatus: "GRANTED" }, select: { slug: true, studentName: true, outcome: true, quote: true, university: { select: { name: true } } } }),
    prisma.document.findMany({ where: { ...published, visibility: "PUBLIC" }, select: { slug: true, title: true, description: true, category: true } }),
  ]);

  return [
    ...STATIC_PAGES,
    ...programmes.map<SearchDoc>((p) => ({
      kind: "programme",
      title: p.title,
      href: `/programmes/${p.slug}`,
      summary: excerpt(p.summary),
      meta: PROGRAMME_TYPE_LABELS[p.type as ProgrammeType] ?? undefined,
      keywords: [p.shortTitle, p.code, p.awardingBody, p.qualification, p.durationLabel].filter(Boolean).join(" "),
    })),
    ...pathways.map<SearchDoc>((p) => ({
      kind: "pathway",
      title: p.title,
      href: `/pathways/${p.slug}`,
      summary: excerpt(p.summary),
      meta: [p.university?.name, p.destination?.country].filter(Boolean).join(" · ") || undefined,
      keywords: [p.subjectArea, p.field, p.structureLabel, p.qualification].filter(Boolean).join(" "),
    })),
    ...destinations.map<SearchDoc>((d) => ({
      kind: "destination",
      title: d.country,
      href: `/destinations/${d.slug}`,
      summary: excerpt(d.summary),
      meta: d.region ?? undefined,
      keywords: `${d.isoCode} study in ${d.country}`,
    })),
    ...universities.map<SearchDoc>((u) => ({
      kind: "university",
      title: u.name,
      href: `/universities/${u.slug}`,
      summary: excerpt(u.summary),
      meta: [u.city, u.destination?.country].filter(Boolean).join(", ") || undefined,
      body: u.programmesOffered ?? undefined,
    })),
    ...faqs.map<SearchDoc>((f) => ({
      kind: "faq",
      title: f.question,
      href: `/faqs#${f.category.toLowerCase()}`,
      summary: excerpt(f.answer),
      meta: FAQ_CATEGORY_LABELS[f.category as FaqCategory] ?? undefined,
      body: f.answer,
    })),
    ...news.map<SearchDoc>((n) => ({ kind: "news", title: n.title, href: `/news/${n.slug}`, summary: excerpt(n.excerpt || n.body), body: n.body })),
    ...events.map<SearchDoc>((e) => ({ kind: "event", title: e.title, href: `/student-life#events`, summary: excerpt(e.description), meta: e.location ?? undefined })),
    ...stories.map<SearchDoc>((s) => ({
      kind: "story",
      title: s.studentName,
      href: `/student-stories/${s.slug}`,
      summary: excerpt(s.quote || s.outcome),
      meta: s.university?.name ?? undefined,
      keywords: "alumni testimonial",
    })),
    ...documents.map<SearchDoc>((d) => ({ kind: "document", title: d.title, href: `/resources#${d.category.toLowerCase()}`, summary: excerpt(d.description), keywords: d.category.toLowerCase().replace(/_/g, " ") })),
  ];
}

/** The index is rebuilt at most every five minutes and immediately after any CMS publish (tag "content"). */
const getIndex = unstable_cache(buildIndex, ["site-search-index"], { revalidate: 300, tags: ["content", "search"] });

export async function searchSite(query: string, limit = 24): Promise<SearchHit[]> {
  const q = query.trim().slice(0, 120);
  if (q.length < 2) return [];
  return rank(await getIndex(), q, limit);
}
