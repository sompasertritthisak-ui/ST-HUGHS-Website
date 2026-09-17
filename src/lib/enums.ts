/**
 * All enumerations are stored as strings in the database (portable across
 * SQLite and PostgreSQL). Labels are the human-readable form used by the CMS.
 * This module is dependency-free so client components can import labels and
 * types without shipping a validator; the zod schemas live in `enum-schemas.ts`.
 * Never render a raw enum value in the public UI.
 */

export const ROLES = ["SUPER_ADMIN", "CONTENT_ADMIN", "EDITOR", "ADMISSIONS", "MARKETING", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super admin",
  CONTENT_ADMIN: "Content admin",
  EDITOR: "Editor",
  ADMISSIONS: "Admissions / counsellor",
  MARKETING: "Marketing",
  VIEWER: "Viewer",
};

export const CONTENT_STATUSES = ["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};
/** Allowed workflow transitions. */
export const STATUS_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  DRAFT: ["IN_REVIEW", "ARCHIVED"],
  IN_REVIEW: ["DRAFT", "APPROVED", "ARCHIVED"],
  APPROVED: ["PUBLISHED", "IN_REVIEW", "ARCHIVED"],
  PUBLISHED: ["ARCHIVED", "DRAFT"],
  ARCHIVED: ["DRAFT"],
};

export const VERIFICATION_STATUSES = ["VERIFIED", "PENDING", "UNVERIFIED"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];
export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  VERIFIED: "Verified",
  PENDING: "Verification pending",
  UNVERIFIED: "Unverified",
};

export const PROGRAMME_TYPES = ["FOUNDATION", "YEAR_ONE", "BACHELOR_PATHWAY", "LANGUAGE", "SHORT_COURSE"] as const;
export type ProgrammeType = (typeof PROGRAMME_TYPES)[number];
export const PROGRAMME_TYPE_LABELS: Record<ProgrammeType, string> = {
  FOUNDATION: "Foundation",
  YEAR_ONE: "Year One",
  BACHELOR_PATHWAY: "Bachelor pathway",
  LANGUAGE: "Language",
  SHORT_COURSE: "Short course",
};

export const MODULE_KINDS = ["CORE", "SUBJECT", "SKILLS", "ENGLISH"] as const;

export const PARTNERSHIP_TYPES = ["NCUK_NETWORK", "DIRECT_PARTNER", "ARTICULATION", "PLANNED"] as const;
export type PartnershipType = (typeof PARTNERSHIP_TYPES)[number];
export const PARTNERSHIP_TYPE_LABELS: Record<PartnershipType, string> = {
  NCUK_NETWORK: "NCUK university partner",
  DIRECT_PARTNER: "Direct partner",
  ARTICULATION: "Articulation agreement",
  PLANNED: "Planned route",
};

export const PARTNER_TYPES = ["AWARDING_BODY", "UNIVERSITY", "EDUCATION", "INDUSTRY", "GOVERNMENT"] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];
export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  AWARDING_BODY: "Awarding body",
  UNIVERSITY: "University",
  EDUCATION: "Education partner",
  INDUSTRY: "Industry partner",
  GOVERNMENT: "Government / regulator",
};

export const AUDIENCES = ["STUDENT", "PARENT", "PARTNER", "EMPLOYER", "OTHER"] as const;
export type Audience = (typeof AUDIENCES)[number];
export const AUDIENCE_LABELS: Record<Audience, string> = {
  STUDENT: "Student",
  PARENT: "Parent / guardian",
  PARTNER: "University or education partner",
  EMPLOYER: "Employer",
  OTHER: "Other",
};

export const ENQUIRY_TYPES = ["ENQUIRY", "CONSULTATION", "BROCHURE", "VISIT"] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

export const ENQUIRY_STATUSES = [
  "NEW",
  "CONTACTED",
  "CONSULTATION_BOOKED",
  "QUALIFIED",
  "APPLICATION_STARTED",
  "APPLICATION_SUBMITTED",
  "CONVERTED",
  "NOT_PROCEEDING",
  "ARCHIVED",
] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];
export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  CONSULTATION_BOOKED: "Consultation booked",
  QUALIFIED: "Qualified",
  APPLICATION_STARTED: "Application started",
  APPLICATION_SUBMITTED: "Application submitted",
  CONVERTED: "Converted",
  NOT_PROCEEDING: "Not proceeding",
  ARCHIVED: "Archived",
};

export const CONSULTATION_MODES = ["IN_PERSON", "ONLINE", "PHONE", "WHATSAPP"] as const;
export type ConsultationMode = (typeof CONSULTATION_MODES)[number];
export const CONSULTATION_MODE_LABELS: Record<ConsultationMode, string> = {
  IN_PERSON: "In person at the campus",
  ONLINE: "Online video call",
  PHONE: "Phone call",
  WHATSAPP: "WhatsApp",
};

export const NEWS_CATEGORIES = [
  "STUDENT_SUCCESS",
  "ACADEMIC",
  "PARTNERSHIPS",
  "EVENTS",
  "CAMPUS",
  "INTERNATIONAL",
  "CAREERS",
  "ANNOUNCEMENTS",
] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];
export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  STUDENT_SUCCESS: "Student success",
  ACADEMIC: "Academic",
  PARTNERSHIPS: "Partnerships",
  EVENTS: "Events",
  CAMPUS: "Campus",
  INTERNATIONAL: "International",
  CAREERS: "Careers",
  ANNOUNCEMENTS: "Announcements",
};

export const FAQ_CATEGORIES = [
  "ADMISSIONS",
  "PROGRAMMES",
  "PATHWAYS",
  "INTERNATIONAL",
  "FEES",
  "CAMPUS",
  "STUDENT_LIFE",
  "PROGRESSION",
  "APPLICATIONS",
  "ENGLISH",
] as const;
export type FaqCategory = (typeof FAQ_CATEGORIES)[number];
export const FAQ_CATEGORY_LABELS: Record<FaqCategory, string> = {
  ADMISSIONS: "Admissions",
  PROGRAMMES: "Programmes",
  PATHWAYS: "Pathways",
  INTERNATIONAL: "International students",
  FEES: "Fees",
  CAMPUS: "Campus",
  STUDENT_LIFE: "Student life",
  PROGRESSION: "University progression",
  APPLICATIONS: "Applications",
  ENGLISH: "English requirements",
};

export const BLOCK_TYPES = [
  "HERO",
  "RICH_TEXT",
  "IMAGE",
  "VIDEO",
  "STATISTICS",
  "PROGRAMME_GRID",
  "UNIVERSITY_GRID",
  "PATHWAY_TIMELINE",
  "MAP",
  "TESTIMONIAL",
  "STUDENT_STORY",
  "FAQ",
  "CTA",
  "GALLERY",
  "COMPARISON_TABLE",
  "LOGO_WALL",
  "QUOTE",
  "MEDIA",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];
export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  HERO: "Hero",
  RICH_TEXT: "Rich text",
  IMAGE: "Image",
  VIDEO: "Video",
  STATISTICS: "Statistics",
  PROGRAMME_GRID: "Programme grid",
  UNIVERSITY_GRID: "University grid",
  PATHWAY_TIMELINE: "Pathway timeline",
  MAP: "Destination map",
  TESTIMONIAL: "Testimonial",
  STUDENT_STORY: "Student story",
  FAQ: "FAQ",
  CTA: "Call to action",
  GALLERY: "Gallery",
  COMPARISON_TABLE: "Comparison table",
  LOGO_WALL: "Logo wall",
  QUOTE: "Quote",
  MEDIA: "Media",
};

export const MEDIA_KINDS = ["IMAGE", "VIDEO", "PDF", "LOGO", "DOCUMENT"] as const;
export const USAGE_STATUSES = ["APPROVED", "INTERNAL", "RESTRICTED", "EXPIRED"] as const;
export const CONSENT_STATUSES = ["NOT_REQUIRED", "PENDING", "GRANTED", "WITHDRAWN"] as const;

export const DOCUMENT_CATEGORIES = [
  "PROSPECTUS",
  "BROCHURE",
  "ENTRY_REQUIREMENTS",
  "APPLICATION",
  "HANDBOOK",
  "CALENDAR",
  "POLICY",
  "GUIDE",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];
export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  PROSPECTUS: "Prospectus",
  BROCHURE: "Programme brochure",
  ENTRY_REQUIREMENTS: "Entry requirements",
  APPLICATION: "Application document",
  HANDBOOK: "Handbook",
  CALENDAR: "Academic calendar",
  POLICY: "Policy",
  GUIDE: "Guide",
};

export const FACILITY_CATEGORIES = ["ARRIVAL", "LEARNING", "STUDY", "SOCIAL", "OUTDOOR"] as const;
export type FacilityCategory = (typeof FACILITY_CATEGORIES)[number];
export const FACILITY_CATEGORY_LABELS: Record<FacilityCategory, string> = {
  ARRIVAL: "Arrival",
  LEARNING: "Learning spaces",
  STUDY: "Study",
  SOCIAL: "Social",
  OUTDOOR: "Outdoor",
};

export const NAV_MENUS = ["HEADER", "FOOTER", "LEGAL", "AUDIENCE"] as const;

export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "PUBLISH",
  "UNPUBLISH",
  "LOGIN",
  "LOGIN_FAILED",
  "ROLLBACK",
  "UPLOAD",
  "STATUS_CHANGE",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const ANALYTICS_EVENTS = [
  "page_view",
  "programme_view",
  "pathway_interaction",
  "destination_click",
  "university_click",
  "enquiry_submitted",
  "consultation_requested",
  "apply_click",
  "brochure_download",
  "outbound_partner_click",
  "explorer_completed",
  "comparison_used",
  "finder_completed",
] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/** Entity types that support revisions, audit and workflow. */
export const ENTITY_TYPES = [
  "Page",
  "Programme",
  "Pathway",
  "Destination",
  "University",
  "Partner",
  "StudentStory",
  "Faculty",
  "Facility",
  "NewsArticle",
  "Event",
  "Faq",
  "Document",
  "Media",
  "NavigationItem",
  "SiteSetting",
  "OutcomeMetric",
  "Enquiry",
  "User",
  "Campaign",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];
