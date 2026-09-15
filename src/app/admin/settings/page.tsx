import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { ContactSettingsSchema, InstitutionSettingsSchema, MessagingSettingsSchema, SETTINGS_TABS, SETTINGS_TAB_LABELS, integrationStatus, readSetting, type SettingsTab } from "@/lib/admin-ops/settings";
import { sp } from "@/lib/admin-ops/form";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AccessDenied } from "@/components/admin-ops/access-denied";
import { PageHeader } from "@/components/admin-ops/page-header";
import { Panel } from "@/components/admin-ops/panel";
import { ContactSettingsForm, InstitutionSettingsForm, MessagingSettingsForm } from "@/components/admin-ops/settings-forms";

export const metadata: Metadata = { title: "Settings · SHV CMS", description: "Site-wide contact, messaging and institution settings." };
export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function SettingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  const canEdit = can(user.role, "settings.update");
  if (!canEdit && !can(user.role, "content.read")) return <AccessDenied area="settings" />;

  const params = await searchParams;
  const raw = sp(params, "tab");
  const tab: SettingsTab = (SETTINGS_TABS as readonly string[]).includes(raw ?? "") ? (raw as SettingsTab) : "contact";

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Configuration" title="Site settings" lede={canEdit ? "Changes go live on the public site immediately after saving. Every save is snapshotted and audited." : "Read-only view."} />
      <nav aria-label="Settings sections" className="flex flex-wrap gap-1 border-b border-line">
        {SETTINGS_TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/settings?tab=${t}`}
            aria-current={t === tab ? "page" : undefined}
            className={cn("-mb-px inline-flex h-11 items-center border-b-2 px-4 text-sm", t === tab ? "border-route font-medium text-fg" : "border-transparent text-fg-muted hover:text-fg")}
          >
            {SETTINGS_TAB_LABELS[t]}
          </Link>
        ))}
      </nav>
      <TabContent tab={tab} canEdit={canEdit} />
    </div>
  );
}

async function TabContent({ tab, canEdit }: { tab: SettingsTab; canEdit: boolean }) {
  if (tab === "integrations") {
    const rows = integrationStatus();
    return (
      <Panel title="Integrations" description="Set through environment variables on the server. Values are never shown here.">
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.key} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-fg">{r.label}</p>
                <p className="text-xs text-fg-muted">
                  <code className="font-mono">{r.key}</code> · {r.note}
                </p>
              </div>
              {r.configured ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-success">
                  <CheckCircle2 aria-hidden className="size-4" strokeWidth={1.75} /> configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-fg-muted">
                  <CircleDashed aria-hidden className="size-4" strokeWidth={1.75} /> not set
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-fg-subtle">
          CRM field mapping and webhook shape are documented in <code className="font-mono">docs/CRM_INTEGRATION.md</code>.
        </p>
      </Panel>
    );
  }
  if (tab === "messaging") {
    const { value, updatedAt } = await readSetting("messaging", MessagingSettingsSchema);
    return (
      <Panel title="Messaging" description={updatedAt ? `Last saved ${formatDateTime(updatedAt)}` : "Using defaults — not yet saved."}>
        <MessagingSettingsForm value={value} canEdit={canEdit} />
      </Panel>
    );
  }
  if (tab === "institution") {
    const { value, updatedAt } = await readSetting("institution", InstitutionSettingsSchema);
    return (
      <Panel title="Institution" description={updatedAt ? `Last saved ${formatDateTime(updatedAt)}` : "Using defaults — not yet saved."}>
        <InstitutionSettingsForm value={value} canEdit={canEdit} />
      </Panel>
    );
  }
  const { value, updatedAt } = await readSetting("contact", ContactSettingsSchema);
  return (
    <Panel title="Contact" description={updatedAt ? `Last saved ${formatDateTime(updatedAt)}` : "Using defaults — not yet saved."}>
      <ContactSettingsForm value={value} canEdit={canEdit} />
    </Panel>
  );
}
