import "server-only";
import { prisma } from "@/lib/prisma";
import type { AdminRecord, DelegateName } from "./types";

/**
 * Minimal structural view of a Prisma model delegate so the CMS can operate on
 * any registered model generically. All model names come from the registry,
 * never from user input.
 */
export interface Delegate {
  findUnique(args: { where: { id: string }; include?: Record<string, unknown>; select?: Record<string, unknown> }): Promise<AdminRecord | null>;
  findFirst(args: Record<string, unknown>): Promise<AdminRecord | null>;
  findMany(args: Record<string, unknown>): Promise<AdminRecord[]>;
  count(args?: Record<string, unknown>): Promise<number>;
  groupBy(args: Record<string, unknown>): Promise<Array<{ status?: string; _count: { _all: number } }>>;
  create(args: { data: Record<string, unknown> }): Promise<AdminRecord>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<AdminRecord>;
  updateMany(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<{ count: number }>;
  delete(args: { where: { id: string } }): Promise<AdminRecord>;
}

export function delegate(name: DelegateName): Delegate {
  return (prisma as unknown as Record<DelegateName, Delegate>)[name];
}
