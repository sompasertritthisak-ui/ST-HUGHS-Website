import { vi } from "vitest";

/**
 * In-memory stand-in for the Prisma client used by API handler tests.
 * Only the delegates the public write APIs touch are modelled.
 */
export type FakeRow = Record<string, unknown> & { id: string };

export function createFakePrisma() {
  let seq = 0;
  const nextId = (prefix: string) => `${prefix}_${++seq}`;

  const programmes: FakeRow[] = [
    { id: "prog_pub", slug: "ncuk-international-foundation-year", title: "NCUK International Foundation Year", status: "PUBLISHED" },
    { id: "prog_draft", slug: "draft-programme", title: "Draft", status: "DRAFT" },
  ];
  const destinations: FakeRow[] = [
    { id: "dest_uk", slug: "united-kingdom", country: "United Kingdom", status: "PUBLISHED" },
    { id: "dest_draft", slug: "atlantis", country: "Atlantis", status: "DRAFT" },
  ];
  const campaigns: FakeRow[] = [{ id: "camp_1", utmCampaign: "open-day-2026", isActive: true }];

  const enquiries: FakeRow[] = [];
  const consultations: FakeRow[] = [];
  const analyticsEvents: FakeRow[] = [];
  const auditLogs: FakeRow[] = [];

  const pick = (row: FakeRow, select?: Record<string, boolean>) => (select ? Object.fromEntries(Object.entries(row).filter(([k]) => select[k])) : row);

  const fake = {
    programme: {
      findUnique: vi.fn(async ({ where, select }: { where: { slug?: string; id?: string }; select?: Record<string, boolean> }) => {
        const row = programmes.find((p) => (where.slug ? p.slug === where.slug : p.id === where.id));
        return row ? pick(row, select) : null;
      }),
    },
    destination: {
      findUnique: vi.fn(async ({ where, select }: { where: { slug?: string; id?: string }; select?: Record<string, boolean> }) => {
        const row = destinations.find((d) => (where.slug ? d.slug === where.slug : d.id === where.id));
        return row ? pick(row, select) : null;
      }),
    },
    campaign: {
      findUnique: vi.fn(async ({ where, select }: { where: { utmCampaign?: string }; select?: Record<string, boolean> }) => {
        const row = campaigns.find((c) => c.utmCampaign === where.utmCampaign);
        return row ? pick(row, select) : null;
      }),
    },
    enquiry: {
      create: vi.fn(async ({ data, select }: { data: Record<string, unknown>; select?: Record<string, boolean> }) => {
        const row: FakeRow = { id: nextId("enq"), createdAt: new Date(), updatedAt: new Date(), ...data };
        enquiries.push(row);
        return pick(row, select);
      }),
    },
    consultation: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row: FakeRow = { id: nextId("cons"), createdAt: new Date(), ...data };
        consultations.push(row);
        return row;
      }),
    },
    analyticsEvent: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row: FakeRow = { id: nextId("evt"), createdAt: new Date(), ...data };
        analyticsEvents.push(row);
        return row;
      }),
    },
    auditLog: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const row: FakeRow = { id: nextId("audit"), createdAt: new Date(), ...data };
        auditLogs.push(row);
        return row;
      }),
    },
    _store: { programmes, destinations, campaigns, enquiries, consultations, analyticsEvents, auditLogs },
    _reset() {
      enquiries.length = 0;
      consultations.length = 0;
      analyticsEvents.length = 0;
      auditLogs.length = 0;
      for (const delegate of [fake.programme, fake.destination, fake.campaign, fake.enquiry, fake.consultation, fake.analyticsEvent, fake.auditLog]) {
        for (const fn of Object.values(delegate)) fn.mockClear();
      }
    },
  };
  return fake;
}

export type FakePrisma = ReturnType<typeof createFakePrisma>;
