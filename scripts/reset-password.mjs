#!/usr/bin/env node
/**
 * Set a new CMS password for one account, directly in the PostgreSQL (Neon) database.
 * For when nobody can sign in to change it from the CMS (Users → reset, or Your account).
 *
 *   node scripts/reset-password.mjs you@example.com
 *
 * Asks for the database connection string (unless DATABASE_URL is already set) and the new password, with typing
 * hidden, so neither is shown on screen or kept in shell history. Hashes it exactly like the CMS (bcrypt, cost 12),
 * re-activates the account, and records the change in the audit log (UPDATE on the User, note "password reset").
 */
import { createInterface } from "node:readline";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

const BCRYPT_COST = 12; // same as src/lib/admin-ops/users.ts

/** Prompt without echoing what is typed. */
function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (s) => rl.output.write(s.startsWith(question) ? question : "");
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

const email = (process.argv[2] ?? (await ask("Account email: "))).toLowerCase();
const url = process.env.DATABASE_URL || (await ask("Neon connection string (hidden): ", { hidden: true }));
if (!/^postgres(ql)?:\/\//.test(url)) {
  console.error("That is not a postgres:// connection string.");
  process.exit(1);
}
const password = await ask("New password, at least 12 characters (hidden): ", { hidden: true });
if (password.length < 12) {
  console.error("Too short: use at least 12 characters.");
  process.exit(1);
}
if ((await ask("Type it again (hidden): ", { hidden: true })) !== password) {
  console.error("The two passwords do not match. Nothing was changed.");
  process.exit(1);
}

const sql = neon(url);
const hash = await bcrypt.hash(password, BCRYPT_COST);
const rows = await sql`UPDATE "User" SET "passwordHash" = ${hash}, "isActive" = true, "updatedAt" = now()
                       WHERE lower("email") = ${email} RETURNING "id", "email", "role"`;
if (rows.length === 0) {
  console.error(`No account with the email ${email} in this database. Nothing was changed.`);
  process.exit(1);
}
await sql`INSERT INTO "AuditLog" ("id", "actorId", "action", "entityType", "entityId", "afterJson", "createdAt")
          VALUES (${randomUUID()}, ${rows[0].id}, 'UPDATE', 'User', ${rows[0].id}, '{"note":"password reset","via":"scripts/reset-password.mjs"}', now())`.catch(
  () => console.warn("(Password changed; the audit-log entry could not be written.)"),
);
console.log(`Done: new password set for ${rows[0].email} (${rows[0].role}). Sign in with it now.`);
