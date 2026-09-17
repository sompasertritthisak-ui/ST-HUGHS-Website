"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { EnquiryStatusSchema } from "@/lib/enum-schemas";
import { guard, requestIp } from "./guard";
import { ASSIGNABLE_ROLES } from "./enquiries";
import { dateOrNull, str, zodErrors } from "./form";
import { fail, succeed, type ActionState } from "./types";

const Id = z.string().min(1).max(64);

function revalidate(id: string) {
  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${id}`);
}

export async function updateEnquiryStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("enquiries.update");
  if (!g.ok) return fail(g.message);
  const parsed = z.object({ id: Id, status: EnquiryStatusSchema }).safeParse({ id: str(formData, "id"), status: str(formData, "status") });
  if (!parsed.success) return fail("Please choose a valid status.", zodErrors(parsed.error));
  const { id, status } = parsed.data;
  const before = await prisma.enquiry.findUnique({ where: { id }, select: { status: true } });
  if (!before) return fail("Enquiry not found.");
  if (before.status === status) return succeed("Status unchanged.");
  await prisma.enquiry.update({ where: { id }, data: { status } });
  await recordAudit({
    actorId: g.user.id,
    action: "STATUS_CHANGE",
    entityType: "Enquiry",
    entityId: id,
    beforeJson: JSON.stringify({ status: before.status }),
    afterJson: JSON.stringify({ status }),
    ip: await requestIp(),
  });
  revalidate(id);
  return succeed("Status updated.");
}

export async function assignEnquiry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("enquiries.assign");
  if (!g.ok) return fail(g.message);
  const parsed = z.object({ id: Id, assignedToId: z.string().max(64) }).safeParse({ id: str(formData, "id"), assignedToId: str(formData, "assignedToId") });
  if (!parsed.success) return fail("Invalid assignment.", zodErrors(parsed.error));
  const { id } = parsed.data;
  const assignedToId = parsed.data.assignedToId || null;
  if (assignedToId) {
    const target = await prisma.user.findUnique({ where: { id: assignedToId }, select: { role: true, isActive: true } });
    if (!target || !target.isActive || !(ASSIGNABLE_ROLES as readonly string[]).includes(target.role)) {
      return fail("That user cannot be assigned enquiries.", { assignedToId: "Choose an active admissions or admin user." });
    }
  }
  const before = await prisma.enquiry.findUnique({ where: { id }, select: { assignedToId: true } });
  if (!before) return fail("Enquiry not found.");
  await prisma.enquiry.update({ where: { id }, data: { assignedToId } });
  await recordAudit({
    actorId: g.user.id,
    action: "UPDATE",
    entityType: "Enquiry",
    entityId: id,
    beforeJson: JSON.stringify({ assignedToId: before.assignedToId }),
    afterJson: JSON.stringify({ assignedToId }),
    ip: await requestIp(),
  });
  revalidate(id);
  return succeed(assignedToId ? "Counsellor assigned." : "Assignment cleared.");
}

export async function setFollowUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("enquiries.update");
  if (!g.ok) return fail(g.message);
  const id = Id.safeParse(str(formData, "id"));
  if (!id.success) return fail("Enquiry not found.");
  const followUpAt = dateOrNull(formData, "followUpAt");
  if (followUpAt === undefined) return fail("Invalid date.", { followUpAt: "Enter a valid date." });
  const before = await prisma.enquiry.findUnique({ where: { id: id.data }, select: { followUpAt: true } });
  if (!before) return fail("Enquiry not found.");
  await prisma.enquiry.update({ where: { id: id.data }, data: { followUpAt } });
  await recordAudit({
    actorId: g.user.id,
    action: "UPDATE",
    entityType: "Enquiry",
    entityId: id.data,
    beforeJson: JSON.stringify({ followUpAt: before.followUpAt }),
    afterJson: JSON.stringify({ followUpAt }),
    ip: await requestIp(),
  });
  revalidate(id.data);
  return succeed(followUpAt ? "Follow-up date saved." : "Follow-up date cleared.");
}

export async function addEnquiryNote(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("enquiries.update");
  if (!g.ok) return fail(g.message);
  const parsed = z.object({ id: Id, body: z.string().trim().min(2, "Write a note first.").max(4000, "Keep notes under 4000 characters.") }).safeParse({ id: str(formData, "id"), body: str(formData, "body") });
  if (!parsed.success) return fail("Note not saved.", zodErrors(parsed.error));
  const exists = await prisma.enquiry.findUnique({ where: { id: parsed.data.id }, select: { id: true } });
  if (!exists) return fail("Enquiry not found.");
  const note = await prisma.enquiryNote.create({ data: { enquiryId: parsed.data.id, authorId: g.user.id, body: parsed.data.body } });
  // Note bodies are private: the audit row records only that a note was added.
  await recordAudit({ actorId: g.user.id, action: "CREATE", entityType: "Enquiry", entityId: parsed.data.id, afterJson: JSON.stringify({ noteId: note.id }), ip: await requestIp() });
  revalidate(parsed.data.id);
  return succeed("Note added.");
}

export async function confirmConsultation(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const g = await guard("enquiries.update");
  if (!g.ok) return fail(g.message);
  const id = Id.safeParse(str(formData, "id"));
  if (!id.success) return fail("Enquiry not found.");
  const consultation = await prisma.consultation.findUnique({ where: { enquiryId: id.data } });
  if (!consultation) return fail("This enquiry has no consultation request.");
  if (consultation.confirmedAt) return succeed("Consultation was already confirmed.");
  const confirmedAt = new Date();
  await prisma.$transaction([
    prisma.consultation.update({ where: { id: consultation.id }, data: { confirmedAt } }),
    prisma.enquiry.updateMany({ where: { id: id.data, status: { in: ["NEW", "CONTACTED"] } }, data: { status: "CONSULTATION_BOOKED" } }),
  ]);
  await recordAudit({
    actorId: g.user.id,
    action: "UPDATE",
    entityType: "Enquiry",
    entityId: id.data,
    beforeJson: JSON.stringify({ confirmedAt: null }),
    afterJson: JSON.stringify({ confirmedAt, consultationId: consultation.id }),
    ip: await requestIp(),
  });
  revalidate(id.data);
  return succeed("Consultation marked as confirmed.");
}
