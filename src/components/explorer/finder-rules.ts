import type { Programme } from "@prisma/client";
import type { PathwayWithRelations } from "@/lib/content";
import { parseStringArray, toSlug } from "@/lib/utils";

/**
 * Rule-based recommendation for the Pathway Finder. Works only on published
 * pathways and programmes; never invents a route. Scores each pathway
 * against the answers, hides ineligible ones, returns the top three plus
 * plain-language notes and questions for the advisor.
 */

export type FinderKey = "qualification" | "subject" | "degree" | "country" | "start" | "english" | "timeline";
export type FinderAnswers = Partial<Record<FinderKey, string>>;
export type FinderOption = { value: string; label: string; hint?: string };

export const QUALIFICATION_OPTIONS: FinderOption[] = [
  { value: "lao-high-school", label: "Lao high school diploma" },
  { value: "igcse", label: "IGCSE / O Level" },
  { value: "a-level", label: "A Level" },
  { value: "ib", label: "International Baccalaureate" },
  { value: "ify-completed", label: "NCUK International Foundation Year completed" },
  { value: "other", label: "Other or not sure" },
];

export const DEGREE_OPTIONS: FinderOption[] = [
  { value: "bachelors", label: "Bachelor's degree" },
  { value: "not-sure", label: "Not sure yet" },
];

export const START_OPTIONS: FinderOption[] = [
  { value: "vte-one-year", label: "Vientiane for the first year", hint: "Then continue abroad" },
  { value: "vte-two-years", label: "Vientiane for the first two years", hint: "Then continue abroad" },
  { value: "flexible", label: "Flexible" },
];

export const ENGLISH_OPTIONS: FinderOption[] = [
  { value: "below-5", label: "Below IELTS 5.0" },
  { value: "about-5", label: "About IELTS 5.0" },
  { value: "about-5-5", label: "About IELTS 5.5 or higher" },
  { value: "not-tested", label: "Not tested yet" },
];

export const TIMELINE_OPTIONS: FinderOption[] = [
  { value: "this-september", label: "This September" },
  { value: "next-year", label: "Next year" },
  { value: "exploring", label: "Just exploring" },
];

const FOUNDATION_TIER = new Set(["lao-high-school", "igcse", "other"]);
const ADVANCED_TIER = new Set(["a-level", "ib", "ify-completed"]);
const INELIGIBLE = -100;

function programmeType(p: PathwayWithRelations) {
  return p.programme?.type ?? null;
}

/** First segment of a structure label such as "1 + 3" or "2 + 2". */
function firstSegment(label: string | null | undefined) {
  const m = (label ?? "").match(/^\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

export type FinderResult = {
  pathways: PathwayWithRelations[];
  programme: Programme | null;
  destinationSlug: string | null;
  notes: string[];
  questions: string[];
  /** True when the country or subject filter had to be relaxed to find a route. */
  relaxed: boolean;
};

export function recommend(answers: FinderAnswers, all: PathwayWithRelations[], programmes: Programme[]): FinderResult {
  const q = answers.qualification ?? "other";
  const subject = answers.subject ?? "not-sure";
  const country = answers.country ?? "any";
  const start = answers.start ?? "flexible";
  const english = answers.english ?? "not-tested";
  const timeline = answers.timeline ?? "exploring";
  const notes: string[] = [];
  const questions: string[] = [];

  const subjectMatches = (p: PathwayWithRelations) => subject === "not-sure" || (p.subjectArea ? toSlug(p.subjectArea) === subject : false);
  const countryMatches = (p: PathwayWithRelations) => country === "any" || p.destination?.slug === country;

  const score = (p: PathwayWithRelations) => {
    const type = programmeType(p);
    let s = 0;
    // Qualification tier. INELIGIBLE is a hard exclusion no bonus can offset.
    if (FOUNDATION_TIER.has(q)) {
      if (type === "FOUNDATION") s += 3;
      if (type === "YEAR_ONE") s += INELIGIBLE; // requires IFY / A Level / IB
    } else if (ADVANCED_TIER.has(q)) {
      if (type === "YEAR_ONE") s += 3;
      if (type === "FOUNDATION") s += q === "ify-completed" ? INELIGIBLE : 0;
    }
    if (!type) s += 1; // partner bachelor routes are open to discussion
    // Subject
    if (subject !== "not-sure") s += subjectMatches(p) ? 3 : -2;
    // Country
    if (country !== "any") s += countryMatches(p) ? 3 : -1;
    // Start location
    const seg = firstSegment(p.structureLabel);
    if (start === "vte-two-years" && seg === 2) s += 2;
    if (start === "vte-one-year" && seg === 1) s += 1;
    // English
    if (english === "below-5") {
      if (type === "FOUNDATION") s += 2;
      if (type === "YEAR_ONE") s -= 2;
    }
    if (english === "about-5" && type === "YEAR_ONE") s -= 1;
    return s;
  };

  const ranked = all
    .map((p) => ({ p, s: score(p) }))
    .filter(({ s }) => s > INELIGIBLE / 2)
    .sort((a, b) => b.s - a.s || Number(b.p.featured) - Number(a.p.featured) || a.p.sortOrder - b.p.sortOrder);

  let picks = ranked.filter(({ p }) => subjectMatches(p) && countryMatches(p)).map(({ p }) => p);
  let relaxed = false;
  if (picks.length === 0 && country !== "any") {
    picks = ranked.filter(({ p }) => subjectMatches(p)).map(({ p }) => p);
    if (picks.length) {
      relaxed = true;
      const wanted = all.find((p) => p.destination?.slug === country)?.destination?.country ?? "that country";
      notes.push(`There is no published route to ${wanted} for this subject yet. The closest published routes are shown; ask the advisor whether ${wanted} is possible.`);
    }
  }
  if (picks.length === 0 && subject !== "not-sure") {
    picks = ranked.map(({ p }) => p);
    if (picks.length) {
      relaxed = true;
      notes.push("No published route matches that subject exactly. The nearest routes are shown; the advisor can confirm the subject modules available at each intake.");
    }
  }
  if (picks.length === 0) picks = ranked.map(({ p }) => p);

  const top = picks.slice(0, 3);
  const lead = top[0] ?? null;
  const programme = lead?.programme ? programmes.find((pr) => pr.slug === lead.programme!.slug) ?? null : null;
  const leadType = lead ? programmeType(lead) : null;

  // Qualification notes
  if (ADVANCED_TIER.has(q) && leadType === "FOUNDATION") {
    notes.push("With your qualification you may be eligible to start at first-year level rather than a foundation year for some subjects. The advisor checks this against the published entry requirements.");
  }
  if (q === "other") {
    notes.push("Equivalencies for other qualifications are confirmed during consultation.");
    questions.push("How is my current qualification assessed against the entry requirements?");
  }
  if (FOUNDATION_TIER.has(q)) {
    questions.push("Which subject modules are offered at SHV for my intake, and do they lead to the degree I want?");
  }
  if (q === "ify-completed") {
    questions.push("Which universities and courses accept my Foundation Year grades for Year 1 or Year 2 entry?");
  }

  // Start location notes
  if (start === "vte-two-years" && !top.some((p) => firstSegment(p.structureLabel) === 2)) {
    notes.push("The published routes shown start abroad after one year in Vientiane. Routes with two years in Vientiane are being confirmed; ask the advisor for the current position.");
  }

  // English notes
  const englishReq = programme?.englishRequirement ?? null;
  if (english === "below-5") {
    notes.push(`English preparation before the programme is confirmed with the advisor.${englishReq ? ` The published requirement is: ${englishReq}` : ""}`);
    questions.push("What English preparation is available before the programme starts, and how long does it take?");
  } else if (english === "about-5" && leadType === "YEAR_ONE") {
    notes.push(`The International Year One has a higher English requirement than the Foundation Year.${englishReq ? ` Published requirement: ${englishReq}` : ""}`);
    questions.push("Is my English level enough for this programme, or should I plan a preparation period?");
  } else if (english === "not-tested") {
    notes.push("You will need an English level assessment. The advisor can arrange one or advise on accepted tests.");
    questions.push("How can I have my English level assessed before I apply?");
  } else if (englishReq) {
    questions.push("Do I meet the English requirement, or is an internal assessment still needed?");
  }

  // Timeline notes
  const intakes = programme ? parseStringArray(programme.intakesJson) : [];
  if (timeline === "this-september") {
    notes.push(intakes.length ? `Published intakes: ${intakes.join(", ")}. Confirm the application deadline with the advisor.` : "Intake dates are confirmed by the admissions team.");
    questions.push("What is the application deadline for the next intake, and what documents do I need?");
  } else if (timeline === "next-year") {
    questions.push("What can I do this year to strengthen my application for next year?");
  } else {
    questions.push("What are the first steps if I decide to go ahead later?");
  }

  // Destination question
  const destinationSlug = country !== "any" ? country : lead?.destination?.slug ?? null;
  const destName = lead?.destination?.country;
  if (destName) questions.push(`${destName}: which universities accept this route for my subject, and what grades do they ask for?`);
  questions.push("What are the total costs for each stage of the route?");

  return { pathways: top, programme, destinationSlug, notes, questions, relaxed };
}
