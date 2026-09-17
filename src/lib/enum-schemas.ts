import { z } from "zod";
import {
  ROLES,
  CONTENT_STATUSES,
  VERIFICATION_STATUSES,
  PROGRAMME_TYPES,
  MODULE_KINDS,
  PARTNERSHIP_TYPES,
  PARTNER_TYPES,
  AUDIENCES,
  ENQUIRY_TYPES,
  ENQUIRY_STATUSES,
  CONSULTATION_MODES,
  NEWS_CATEGORIES,
  FAQ_CATEGORIES,
  BLOCK_TYPES,
  MEDIA_KINDS,
  USAGE_STATUSES,
  CONSENT_STATUSES,
  DOCUMENT_CATEGORIES,
  FACILITY_CATEGORIES,
  NAV_MENUS,
  AUDIT_ACTIONS,
  ANALYTICS_EVENTS,
  ENTITY_TYPES,
} from "./enums";

/**
 * Zod schemas for every enumeration in `enums.ts`. Server code (actions, API
 * routes, seed) and the lead forms import from here; everything else should
 * import the plain constants from `enums.ts` to keep zod out of shared bundles.
 */
export * from "./enums";

export const RoleSchema = z.enum(ROLES);
export const ContentStatusSchema = z.enum(CONTENT_STATUSES);
export const VerificationStatusSchema = z.enum(VERIFICATION_STATUSES);
export const ProgrammeTypeSchema = z.enum(PROGRAMME_TYPES);
export const ModuleKindSchema = z.enum(MODULE_KINDS);
export const PartnershipTypeSchema = z.enum(PARTNERSHIP_TYPES);
export const PartnerTypeSchema = z.enum(PARTNER_TYPES);
export const AudienceSchema = z.enum(AUDIENCES);
export const EnquiryTypeSchema = z.enum(ENQUIRY_TYPES);
export const EnquiryStatusSchema = z.enum(ENQUIRY_STATUSES);
export const ConsultationModeSchema = z.enum(CONSULTATION_MODES);
export const NewsCategorySchema = z.enum(NEWS_CATEGORIES);
export const FaqCategorySchema = z.enum(FAQ_CATEGORIES);
export const BlockTypeSchema = z.enum(BLOCK_TYPES);
export const MediaKindSchema = z.enum(MEDIA_KINDS);
export const UsageStatusSchema = z.enum(USAGE_STATUSES);
export const ConsentStatusSchema = z.enum(CONSENT_STATUSES);
export const DocumentCategorySchema = z.enum(DOCUMENT_CATEGORIES);
export const FacilityCategorySchema = z.enum(FACILITY_CATEGORIES);
export const NavMenuSchema = z.enum(NAV_MENUS);
export const AuditActionSchema = z.enum(AUDIT_ACTIONS);
export const AnalyticsEventSchema = z.enum(ANALYTICS_EVENTS);
export const EntityTypeSchema = z.enum(ENTITY_TYPES);
