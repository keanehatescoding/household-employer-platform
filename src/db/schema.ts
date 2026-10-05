import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const workerRoleEnum = pgEnum("worker_role", [
  "house_help",
  "nanny",
  "cook",
  "gardener",
  "driver",
  "security",
  "other",
]);
export const vettingStatusEnum = pgEnum("vetting_status", [
  "unverified",
  "id_verified",
  "references_checked",
  "background_cleared",
]);
export const placementStatusEnum = pgEnum("placement_status", ["active", "ended", "terminated"]);
export const payrollStatusEnum = pgEnum("payroll_status", ["pending", "sent", "failed"]);
export const filingKindEnum = pgEnum("filing_kind", ["nssf", "nhif", "shif", "paye", "nita", "ahl"]);
export const filingStatusEnum = pgEnum("filing_status", ["pending", "submitted", "paid", "failed"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** The household — one or more adults living at the same address who employ the workers. */
export const employers = pgTable("employers", {
  id: uuid("id").primaryKey().defaultRandom(),
  primaryUserId: uuid("primary_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  householdName: text("household_name").notNull(),
  neighbourhood: text("neighbourhood").notNull(),
  town: text("town").notNull().default("Nairobi"),
  // KRA PIN of the lead employer. Needed before PAYE filings can go.
  kraPin: text("kra_pin"),
  ...timestamps,
});

export const workers = pgTable(
  "workers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    nationalId: text("national_id").notNull(),
    phone: text("phone").notNull(),
    kraPin: text("kra_pin"),
    nssfNumber: text("nssf_number"),
    shifNumber: text("shif_number"),
    role: workerRoleEnum("role").notNull(),
    homeCounty: text("home_county"),
    vetting: vettingStatusEnum("vetting").notNull().default("unverified"),
    vettingNotes: text("vetting_notes").notNull().default(""),
    ...timestamps,
  },
  (t) => [uniqueIndex("workers_national_id_idx").on(t.nationalId)],
);

/** The one worker <-> one employer relationship over time. A worker can be placed with several employers. */
export const placements = pgTable(
  "placements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employerId: uuid("employer_id")
      .notNull()
      .references(() => employers.id, { onDelete: "cascade" }),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => workers.id, { onDelete: "restrict" }),
    role: workerRoleEnum("role").notNull(),
    status: placementStatusEnum("status").notNull().default("active"),
    monthlyPayKes: integer("monthly_pay_kes").notNull(),
    startedOn: date("started_on", { mode: "string" }).notNull(),
    endedOn: date("ended_on", { mode: "string" }),
    offBoardingReason: text("off_boarding_reason").notNull().default(""),
    ...timestamps,
  },
  (t) => [
    index("placements_employer_idx").on(t.employerId, t.status),
    index("placements_worker_idx").on(t.workerId, t.status),
  ],
);

export const payrollRuns = pgTable(
  "payroll_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placementId: uuid("placement_id")
      .notNull()
      .references(() => placements.id, { onDelete: "cascade" }),
    // "YYYY-MM"; one run per placement per month, enforced by a unique index.
    period: text("period").notNull(),
    grossKes: integer("gross_kes").notNull(),
    payeKes: integer("paye_kes").notNull().default(0),
    nssfKes: integer("nssf_kes").notNull().default(0),
    shifKes: integer("shif_kes").notNull().default(0),
    ahlKes: integer("ahl_kes").notNull().default(0),
    advanceKes: integer("advance_kes").notNull().default(0),
    netKes: integer("net_kes").notNull(),
    status: payrollStatusEnum("status").notNull().default("pending"),
    mpesaReceipt: text("mpesa_receipt"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("payroll_runs_placement_period_idx").on(t.placementId, t.period)],
);

export const statutoryFilings = pgTable(
  "statutory_filings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employerId: uuid("employer_id")
      .notNull()
      .references(() => employers.id, { onDelete: "cascade" }),
    kind: filingKindEnum("kind").notNull(),
    period: text("period").notNull(),
    totalKes: integer("total_kes").notNull(),
    status: filingStatusEnum("status").notNull().default("pending"),
    referenceNumber: text("reference_number"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("statutory_filings_employer_kind_period_idx").on(t.employerId, t.kind, t.period)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placementId: uuid("placement_id")
      .notNull()
      .references(() => placements.id, { onDelete: "cascade" }),
    authorEmployerId: uuid("author_employer_id")
      .notNull()
      .references(() => employers.id, { onDelete: "cascade" }),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => workers.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    body: text("body").notNull().default(""),
    // Shared with other employers checking this worker's history (consent required).
    sharedWithOthers: boolean("shared_with_others").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reviews_worker_idx").on(t.workerId, t.createdAt)],
);

export const placementRelations = relations(placements, ({ one, many }) => ({
  employer: one(employers, { fields: [placements.employerId], references: [employers.id] }),
  worker: one(workers, { fields: [placements.workerId], references: [workers.id] }),
  payrollRuns: many(payrollRuns),
  reviews: many(reviews),
}));

export type Employer = typeof employers.$inferSelect;
export type Worker = typeof workers.$inferSelect;
export type Placement = typeof placements.$inferSelect;
export type PayrollRun = typeof payrollRuns.$inferSelect;
export type StatutoryFiling = typeof statutoryFilings.$inferSelect;
