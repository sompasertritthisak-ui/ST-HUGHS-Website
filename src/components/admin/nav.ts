import { can, type Permission } from "@/lib/rbac";

export interface NavItem {
  label: string;
  href: string;
  permission: Permission;
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}

const content = (label: string, href: string): NavItem => ({ label, href, permission: "content.read" });

export const NAV_GROUPS: NavGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/admin", permission: "content.read" }] },
  {
    label: "Content",
    items: [
      content("Pages", "/admin/pages"),
      content("Programmes", "/admin/programmes"),
      content("Pathways", "/admin/pathways"),
      content("Destinations", "/admin/destinations"),
      content("Universities", "/admin/universities"),
      content("Partners", "/admin/partners"),
      content("Student stories", "/admin/student-stories"),
      content("Faculty", "/admin/faculty"),
      content("Facilities", "/admin/facilities"),
      content("Outcome metrics", "/admin/outcome-metrics"),
    ],
  },
  {
    label: "Editorial",
    items: [content("News", "/admin/news"), content("Events", "/admin/events"), content("FAQs", "/admin/faqs"), content("Documents", "/admin/documents"), { label: "Media", href: "/admin/media", permission: "media.read" }],
  },
  {
    label: "Admissions & marketing",
    items: [
      { label: "Enquiries", href: "/admin/enquiries", permission: "enquiries.read" },
      { label: "Campaigns", href: "/admin/campaigns", permission: "campaigns.manage" },
      { label: "Analytics", href: "/admin/analytics", permission: "analytics.read" },
    ],
  },
  {
    label: "Site",
    items: [
      { label: "Navigation", href: "/admin/navigation", permission: "navigation.update" },
      { label: "Settings", href: "/admin/settings", permission: "settings.update" },
      { label: "Users", href: "/admin/users", permission: "users.read" },
      { label: "Audit log", href: "/admin/audit", permission: "audit.read" },
    ],
  },
];

/** Groups filtered to what the role may access (server-side; the client only renders). */
export function navForRole(role: string): NavGroup[] {
  return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => can(role, i.permission)) })).filter((g) => g.items.length > 0);
}
