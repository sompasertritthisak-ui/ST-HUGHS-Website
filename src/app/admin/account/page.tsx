import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { ROLE_LABELS, type Role } from "@/lib/enums";
import { PageHeader } from "@/components/admin-ops/page-header";
import { Dl, Panel } from "@/components/admin-ops/panel";
import { ChangeOwnPasswordForm } from "@/components/admin-ops/user-forms";

export const metadata: Metadata = { title: "Your account · SHV CMS" };
export const dynamic = "force-dynamic";

/** Every signed-in staff member can see their own details and change their own password here. */
export default async function AccountPage() {
  const me = await currentUser();
  if (!me) redirect("/admin/login");
  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Your account" title={me.name || me.email} lede="Your sign-in details. Only you can change your password here; an admin can reset it if you forget it." />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem] [&>*]:min-w-0">
        <Panel title="Change password" description="You will stay signed in on this device.">
          <ChangeOwnPasswordForm />
        </Panel>
        <Panel title="Details">
          <Dl
            items={[
              { label: "Name", value: me.name || "—" },
              { label: "Email", value: me.email },
              { label: "Role", value: ROLE_LABELS[me.role as Role] ?? me.role },
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}
