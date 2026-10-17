import { can, type Permission } from "@/lib/rbac";

/** Icon names are resolved in the sidebar (client); kept as strings so this file stays server-safe. */
export type NavIcon =
  | "dashboard" | "pages" | "programmes" | "pathways" | "destinations" | "universities" | "partners" | "stories" | "faculty" | "facilities" | "metrics"
  | "news" | "events" | "faqs" | "documents" | "media" | "enquiries" | "campaigns" | "analytics" | "navigation" | "settings" | "users" | "audit";

export interface NavItem {
  label: string;
  href: string;
  permission: Permission;
  icon: NavIcon;
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}

const content = (label: string, href: string, icon: NavIcon): NavItem => ({ label, href, permission: "content.read", icon });

export const NAV_GROUPS: NavGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/admin", permission: "content.read", icon: "dashboard" }] },
  {
    label: "Content",
    items: [
      content("Pages", "/admin/pages", "pages"),
      content("Programmes", "/admin/programmes", "programmes"),
      content("Pathways", "/admin/pathways", "pathways"),
      content("Destinations", "/admin/destinations", "destinations"),
      content("Universities", "/admin/universities", "universities"),
      content("Partners", "/admin/partners", "partners"),
      content("Student stories", "/admin/student-stories", "stories"),
      content("Faculty", "/admin/faculty", "faculty"),
      content("Facilities", "/admin/facilities", "facilities"),
      content("Outcome metrics", "/admin/outcome-metrics", "metrics"),
    ],
  },
  {
    label: "Editorial",
    items: [content("News", "/admin/news", "news"), content("Events", "/admin/events", "events"), content("FAQs", "/admin/faqs", "faqs"), content("Documents", "/admin/documents", "documents"), { label: "Media", href: "/admin/media", permission: "media.read", icon: "media" }],
  },
  {
    label: "Admissions & marketing",
    items: [
      { label: "Enquiries", href: "/admin/enquiries", permission: "enquiries.read", icon: "enquiries" },
      { label: "Campaigns", href: "/admin/campaigns", permission: "campaigns.manage", icon: "campaigns" },
      { label: "Analytics", href: "/admin/analytics", permission: "analytics.read", icon: "analytics" },
    ],
  },
  {
    label: "Site",
    items: [
      { label: "Navigation", href: "/admin/navigation", permission: "navigation.update", icon: "navigation" },
      { label: "Settings", href: "/admin/settings", permission: "settings.update", icon: "settings" },
      { label: "Users", href: "/admin/users", permission: "users.read", icon: "users" },
      { label: "Audit log", href: "/admin/audit", permission: "audit.read", icon: "audit" },
    ],
  },
];

/** Groups filtered to what the role may access (server-side; the client only renders). */
export function navForRole(role: string): NavGroup[] {
  return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => can(role, i.permission)) })).filter((g) => g.items.length > 0);
}
