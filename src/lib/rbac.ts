import type { Role } from "./enums";

/**
 * Permission matrix. Permissions are strings of the form `<area>.<action>`.
 * `*` grants everything. Checked server-side only — never trust the client.
 */
export type Permission =
  | "*"
  | "content.read"
  | "content.create"
  | "content.update"
  | "content.delete"
  | "content.submit"
  | "content.approve"
  | "content.publish"
  | "content.rollback"
  | "media.read"
  | "media.upload"
  | "media.update"
  | "media.delete"
  | "enquiries.read"
  | "enquiries.update"
  | "enquiries.assign"
  | "enquiries.export"
  | "analytics.read"
  | "campaigns.manage"
  | "seo.update"
  | "navigation.update"
  | "settings.update"
  | "users.read"
  | "users.manage"
  | "audit.read";

const MATRIX: Record<Role, Permission[]> = {
  SUPER_ADMIN: ["*"],
  CONTENT_ADMIN: [
    "content.read",
    "content.create",
    "content.update",
    "content.delete",
    "content.submit",
    "content.approve",
    "content.publish",
    "content.rollback",
    "media.read",
    "media.upload",
    "media.update",
    "media.delete",
    "seo.update",
    "navigation.update",
    "settings.update",
    "users.read",
    "audit.read",
    "analytics.read",
    "enquiries.read",
  ],
  EDITOR: [
    "content.read",
    "content.create",
    "content.update",
    "content.submit",
    "media.read",
    "media.upload",
    "media.update",
  ],
  ADMISSIONS: [
    "content.read",
    "enquiries.read",
    "enquiries.update",
    "enquiries.assign",
    "enquiries.export",
    "media.read",
    "analytics.read",
  ],
  MARKETING: [
    "content.read",
    "content.create",
    "content.update",
    "content.submit",
    "media.read",
    "media.upload",
    "media.update",
    "campaigns.manage",
    "analytics.read",
    "seo.update",
    "enquiries.read",
  ],
  VIEWER: ["content.read", "media.read"],
};

export function can(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const grants = MATRIX[role as Role];
  if (!grants) return false;
  return grants.includes("*") || grants.includes(permission);
}

export function permissionsFor(role: string | null | undefined): Permission[] {
  if (!role) return [];
  return MATRIX[role as Role] ?? [];
}

/** Which roles may move content into a given status. */
export function canTransitionTo(role: string | null | undefined, to: string): boolean {
  switch (to) {
    case "PUBLISHED":
      return can(role, "content.publish");
    case "APPROVED":
      return can(role, "content.approve");
    case "IN_REVIEW":
      return can(role, "content.submit");
    case "ARCHIVED":
      return can(role, "content.publish") || can(role, "content.delete");
    case "DRAFT":
      return can(role, "content.update");
    default:
      return false;
  }
}
