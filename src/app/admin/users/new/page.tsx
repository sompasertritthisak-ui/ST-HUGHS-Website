import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/admin-ops/access-denied";
import { PageHeader } from "@/components/admin-ops/page-header";
import { Panel } from "@/components/admin-ops/panel";
import { CreateUserForm } from "@/components/admin-ops/user-forms";

export const metadata: Metadata = { title: "New user · SHV CMS" };
export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (!can(user.role, "users.manage")) return <AccessDenied area="user management" />;
  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} /> Back to users
      </Link>
      <PageHeader eyebrow="Access" title="New user" lede="Passwords are hashed with bcrypt (cost 12). A generated temporary password is shown exactly once." />
      <Panel>
        <CreateUserForm actorRole={user.role} />
      </Panel>
    </div>
  );
}
