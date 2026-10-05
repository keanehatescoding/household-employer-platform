# Household-employer platform (vetting + payroll/benefits)

- **Concept:** A self-serve app for individual households to background-check a prospective house help, driver, gardener or nanny, then manage their statutory NSSF/SHIF payroll and generate digital payslips — a job today's registered-business payroll tools don't serve and full-service agencies charge a premium for.
- **Origin:** Comparable models abroad: HomePay by Care.com and Poppy handle household-employer payroll/tax in the US; Nannytax does the same in the UK; SweepSouth in South Africa covers parts of this for domestic workers.
- **Evidence of demand:** Household-staff trust and safety concerns are a recurring, well-documented theme in Kenyan media (accounts of theft and mistrust are common); Kenya's Data Protection Act now governs how background checks must be consented to and handled, which a purpose-built product can bake in.
- **Kenya landscape:** Corporate background-check firms (Semafacts, Peleza, Bigscope and others) exist but sell to HR departments doing bulk corporate hiring, not to individual households; domestic-staff vetting for households is currently bundled into full-service placement agencies (e.g., Bestcare), not offered as a standalone, self-serve digital product; general payroll SaaS (Deel, Workpay, PaySpace-style tools) is built for registered businesses, not a household with one employee.
- **Opportunity:** Package identity/criminal-record verification (via an existing background-check API) with simple NSSF/SHIF-compliant payslip generation, aimed specifically at individual employers.
- **Target customers:** Urban middle- and upper-middle-class households and diaspora families employing domestic staff remotely.
- **Revenue model:** Monthly subscription per household for payroll admin, plus a one-time vetting fee per candidate checked.
- **Difficulty:** Medium — needs a data partnership for background checks (likely via an existing screening firm's API rather than building police-record access from scratch) and correct NSSF/SHIF payroll logic.
- **Scalability:** Medium — domestic-worker informality is a regional pattern, but each country's statutory-benefits system differs.
- **Risks:** Consent and data-protection handling must be airtight; trust-building takes time in a sensitive, personal category; low average transaction value means volume is essential.
- **MVP:** Launch vetting only — partner with an existing screening firm's API for identity + criminal-record checks, wrapped in a simple consumer app — before building the payroll layer.

---

Source: `PROJECTS.md` (Online Business Models: Proven Abroad, Underdeveloped in Kenya).


---

## Stack & dev

Scaffolded as a Next.js 16 + Drizzle (Postgres) app, matching the stack used in `odpc-compliance-saas`. The schema in `src/db/schema.ts` is the current source of truth for the data model; UI, auth and payment integrations are not yet wired up.

```
npm install
# point .env at a Postgres instance, see .env.example
npm run db:generate   # drizzle-kit: emit SQL migrations from the schema
npm run db:migrate    # apply them (migrator script not yet included — copy from odpc-compliance-saas)
npm run dev           # Next.js dev server on :3000
```

What is here:
- `src/db/schema.ts` — Drizzle Postgres schema specific to this domain
- `src/db/index.ts` — pooled `pg` + Drizzle client
- `drizzle.config.ts`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`
- `src/app/globals.css`, `.gitignore`, `.env.example`

What is still a stub:
- `src/app/layout.tsx` + `src/app/page.tsx` — scaffold against the installed Next version (see `node_modules/next/dist/docs/`); the `odpc-compliance-saas` siblings are a working reference.
- Auth (sessions, password reset, email verify) — copy and adapt the `lib/session.ts`, `lib/password.ts`, `lib/email-verification.ts` set from `odpc-compliance-saas`.
- Payments (M-Pesa Daraja / Paystack / card) — stack-specific, add per project.
- `scripts/migrate.ts`, `scripts/seed.ts` — not yet included; the `package.json` scripts expect them.
