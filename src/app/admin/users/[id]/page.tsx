import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { can, permissionsFor } from "@/lib/rbac";
import { ROLE_LABELS, type Role } from "@/lib/enums";
import { getUserWithHistory } from "@/lib/admin-ops/users";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AccessDenied } from "@/components/admin-ops/access-denied";
import { PageHeader } from "@/components/admin-ops/page-header";
import { Dl, Panel } from "@/components/admin-ops/panel";
import { DeactivateUserForm, DeleteUserForm, EditUserForm, ResetPasswordForm } from "@/components/admin-ops/user-forms";

export const metadata: Metadata = { title: "User · SHV CMS" };
export const dynamic = "force-dynamic";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await currentUser();
  if (!actor) redirect("/admin/login");
  if (!can(actor.role, "users.read")) return <AccessDenied area="user management" />;
  const { id } = await params;
  const u = await getUserWithHistory(id);
  if (!u) notFound();

  const manage = can(actor.role, "users.manage");
  const isSelf = u.id === actor.id;
  const lockedBySuper = u.role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN" && !isSelf;
  const history = Object.values(u._count).reduce((a, b) => a + b, 0);
  const perms = permissionsFor(u.role);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} /> Back to users
      </Link>
      <PageHeader
        eyebrow={ROLE_LABELS[u.role as Role] ?? u.role}
        title={u.name}
        lede={<code className="font-mono text-xs">{u.email}</code>}
        actions={u.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Deactivated</Badge>}
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          <Panel title="Account" description={lockedBySuper ? "Only a super admin can edit another super admin." : undefined}>
            {manage && !lockedBySuper ? (
              <EditUserForm user={{ id: u.id, name: u.name, role: u.role, isActive: u.isActive }} actorRole={actor.role} isSelf={isSelf} />
            ) : (
              <Dl items={[{ label: "Name", value: u.name }, { label: "Role", value: ROLE_LABELS[u.role as Role] ?? u.role }, { label: "Active", value: u.isActive ? "Yes" : "No" }]} />
            )}
          </Panel>
          <Panel title="Permissions" description="Derived from the role. Checked on every server action and API call.">
            <ul className="flex flex-wrap gap-1.5">
              {perms.map((p) => (
                <li key={p}>
                  <Badge>{p === "*" ? "all permissions" : p}</Badge>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Activity">
            <Dl
              items={[
                { label: "Last login", value: u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never" },
                { label: "Created", value: formatDateTime(u.createdAt) },
                { label: "Updated", value: formatDateTime(u.updatedAt) },
                { label: "Audit entries", value: <Link href={`/admin/audit?actorId=${u.id}`} className="underline underline-offset-2">{u._count.auditLogs}</Link> },
                { label: "Revisions", value: String(u._count.revisions) },
                { label: "Assigned enquiries", value: <Link href={`/admin/enquiries?view=list&assignedToId=${u.id}`} className="underline underline-offset-2">{u._count.assignedEnquiries}</Link> },
                { label: "Owned content", value: String(u._count.ownedProgrammes + u._count.ownedPathways + u._count.newsArticles) },
              ]}
            />
          </Panel>
        </div>
        {manage && !lockedBySuper ? (
          <aside className="flex flex-col gap-4" aria-label="Account actions">
            <Panel title="Password">
              <ResetPasswordForm userId={u.id} />
            </Panel>
            {!isSelf ? (
              <Panel title="Danger zone">
                <div className="flex flex-col gap-4">
                  <DeactivateUserForm userId={u.id} isActive={u.isActive} isSelf={isSelf} />
                  <DeleteUserForm userId={u.id} historyCount={history} isSelf={isSelf} />
                </div>
              </Panel>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
