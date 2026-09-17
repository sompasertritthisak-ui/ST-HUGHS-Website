import { describe, expect, it } from "vitest";
import { normaliseDatabaseUrl } from "./database-url";

describe("normaliseDatabaseUrl", () => {
  it("leaves non-postgres URLs alone", () => {
    expect(normaliseDatabaseUrl("file:./dev.db")).toBe("file:./dev.db");
    expect(normaliseDatabaseUrl(undefined)).toBeUndefined();
  });

  it("adds pgbouncer only for Neon pooled hosts", () => {
    const pooled = new URL(normaliseDatabaseUrl("postgresql://u:p@ep-x-pooler.ap-southeast-1.aws.neon.tech/db?sslmode=require")!);
    expect(pooled.searchParams.get("pgbouncer")).toBe("true");
    const direct = new URL(normaliseDatabaseUrl("postgresql://u:p@ep-x.ap-southeast-1.aws.neon.tech/db")!);
    expect(direct.searchParams.has("pgbouncer")).toBe(false);
  });

  it("caps the pool and lengthens timeouts without overriding explicit values", () => {
    const u = new URL(normaliseDatabaseUrl("postgres://u:p@host/db?connection_limit=2")!);
    expect(u.searchParams.get("connection_limit")).toBe("2");
    expect(u.searchParams.get("pool_timeout")).toBe("30");
    expect(u.searchParams.get("connect_timeout")).toBe("20");
    expect(u.searchParams.get("sslmode")).toBe("require");
  });
});
