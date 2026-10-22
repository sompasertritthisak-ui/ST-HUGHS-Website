// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

const state = vi.hoisted(() => ({ hash: "", me: { id: "u1", email: "a@sthughs.edu.la", name: "A", role: "EDITOR" } as { id: string; email: string; name: string; role: string } | null, active: true }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async () => (state.me ? { id: state.me.id, passwordHash: state.hash, isActive: state.active } : null)),
      update: vi.fn(async ({ data }: { data: { passwordHash: string } }) => {
        state.hash = data.passwordHash;
        return {};
      }),
    },
  },
}));
vi.mock("@/lib/auth", () => ({ currentUser: vi.fn(async () => state.me) }));
vi.mock("@/lib/audit", () => ({ recordAudit: vi.fn(async () => {}), createRevision: vi.fn(async () => {}) }));
vi.mock("./guard", () => ({ guard: vi.fn(), requestIp: vi.fn(async () => "127.0.0.1") }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { changeOwnPassword } from "./users-actions";
import { recordAudit } from "@/lib/audit";

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const prev = { ok: false, message: "", at: 0 };
let n = 0;

beforeEach(async () => {
  state.hash = await bcrypt.hash("old password 123", 4);
  state.me = { id: `u${++n}`, email: "a@sthughs.edu.la", name: "A", role: "EDITOR" }; // fresh id = fresh rate-limit bucket
  state.active = true;
  vi.mocked(recordAudit).mockClear();
});

describe("changeOwnPassword", () => {
  it("changes the password when the current one is right and the new one is valid", async () => {
    const r = await changeOwnPassword(prev, form({ currentPassword: "old password 123", newPassword: "a brand new sentence", confirmPassword: "a brand new sentence" }));
    expect(r.ok).toBe(true);
    expect(await bcrypt.compare("a brand new sentence", state.hash)).toBe(true);
    expect(recordAudit).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(recordAudit).mock.calls[0][0])).not.toContain("a brand new sentence");
  });
  it("rejects a wrong current password without changing anything", async () => {
    const before = state.hash;
    const r = await changeOwnPassword(prev, form({ currentPassword: "wrong", newPassword: "a brand new sentence", confirmPassword: "a brand new sentence" }));
    expect(r.ok).toBe(false);
    expect(r.errors?.currentPassword).toBeTruthy();
    expect(state.hash).toBe(before);
  });
  it("enforces length, matching confirmation and a different password", async () => {
    expect((await changeOwnPassword(prev, form({ currentPassword: "old password 123", newPassword: "short", confirmPassword: "short" }))).errors?.newPassword).toBeTruthy();
    expect((await changeOwnPassword(prev, form({ currentPassword: "old password 123", newPassword: "a brand new sentence", confirmPassword: "something else entirely" }))).errors?.confirmPassword).toBeTruthy();
    expect((await changeOwnPassword(prev, form({ currentPassword: "old password 123", newPassword: "old password 123", confirmPassword: "old password 123" }))).errors?.newPassword).toBeTruthy();
  });
  it("requires a signed-in, active account", async () => {
    state.me = null;
    expect((await changeOwnPassword(prev, form({ currentPassword: "x", newPassword: "a brand new sentence", confirmPassword: "a brand new sentence" }))).ok).toBe(false);
    state.me = { id: "inactive", email: "", name: "", role: "EDITOR" };
    state.active = false;
    expect((await changeOwnPassword(prev, form({ currentPassword: "old password 123", newPassword: "a brand new sentence", confirmPassword: "a brand new sentence" }))).ok).toBe(false);
  });
  it("limits attempts to 5 per 15 minutes per account", async () => {
    for (let i = 0; i < 5; i++) await changeOwnPassword(prev, form({ currentPassword: "wrong", newPassword: "a brand new sentence", confirmPassword: "a brand new sentence" }));
    const r = await changeOwnPassword(prev, form({ currentPassword: "old password 123", newPassword: "a brand new sentence", confirmPassword: "a brand new sentence" }));
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/too many attempts/i);
  });
});
