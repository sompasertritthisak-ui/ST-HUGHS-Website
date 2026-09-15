import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { ROLE_LABELS, type Role } from "@/lib/enums";
import { listUsers } from "@/lib/admin-ops/users";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccessDenied } from "@/components/admin-ops/access-denied";
import { PageHeader } from "@/components/admin-ops/page-header";
import { EmptyRow, Table, Td, Th, Tr } from "@/components/admin-ops/table";

export const metadata: Metadata = { title: "Users · SHV CMS", description: "Staff accounts and roles." };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, "users.read")) return <AccessDenied area="user management" />;
  const manage = can(user.role, "users.manage");
  const users = await listUsers();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Access"
        title="Users"
        lede="Staff accounts for the CMS. Roles map to permissions server-side; deactivate rather than delete to keep the audit trail intact."
        actions={
          manage ? (
            <Button href="/admin/users/new" size="sm">
              <Plus aria-hidden className="size-4" strokeWidth={1.75} /> New user
            </Button>
          ) : null
        }
      />
      <Table caption="Users">
        <thead>
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Last login</Th>
            <Th>Created</Th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <EmptyRow colSpan={6}>No users.</EmptyRow>
          ) : (
            users.map((u) => (
              <Tr key={u.id} className={u.isActive ? "" : "text-fg-muted"}>
                <Td>
                  <Link href={`/admin/users/${u.id}`} className="font-medium text-fg underline-offset-2 hover:underline">
                    {u.name}
                  </Link>
                  {u.id === user.id ? <span className="ml-2 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-fg-muted">you</span> : null}
                </Td>
                <Td className="font-mono text-xs">{u.email}</Td>
                <Td>{ROLE_LABELS[u.role as Role] ?? u.role}</Td>
                <Td>{u.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Deactivated</Badge>}</Td>
                <Td className="whitespace-nowrap text-fg-muted">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : <span className="text-fg-subtle">Never</span>}</Td>
                <Td className="whitespace-nowrap text-fg-muted">{formatDateTime(u.createdAt)}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}
