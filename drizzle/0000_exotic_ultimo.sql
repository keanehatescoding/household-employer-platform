CREATE TYPE "public"."filing_kind" AS ENUM('nssf', 'nhif', 'shif', 'paye', 'nita', 'ahl');--> statement-breakpoint
CREATE TYPE "public"."filing_status" AS ENUM('pending', 'submitted', 'paid', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payroll_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."placement_status" AS ENUM('active', 'ended', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."vetting_status" AS ENUM('unverified', 'id_verified', 'references_checked', 'background_cleared');--> statement-breakpoint
CREATE TYPE "public"."worker_role" AS ENUM('house_help', 'nanny', 'cook', 'gardener', 'driver', 'security', 'other');--> statement-breakpoint
CREATE TABLE "employers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"primary_user_id" uuid NOT NULL,
	"household_name" text NOT NULL,
	"neighbourhood" text NOT NULL,
	"town" text DEFAULT 'Nairobi' NOT NULL,
	"kra_pin" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placement_id" uuid NOT NULL,
	"period" text NOT NULL,
	"gross_kes" integer NOT NULL,
	"paye_kes" integer DEFAULT 0 NOT NULL,
	"nssf_kes" integer DEFAULT 0 NOT NULL,
	"shif_kes" integer DEFAULT 0 NOT NULL,
	"ahl_kes" integer DEFAULT 0 NOT NULL,
	"advance_kes" integer DEFAULT 0 NOT NULL,
	"net_kes" integer NOT NULL,
	"status" "payroll_status" DEFAULT 'pending' NOT NULL,
	"mpesa_receipt" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employer_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"role" "worker_role" NOT NULL,
	"status" "placement_status" DEFAULT 'active' NOT NULL,
	"monthly_pay_kes" integer NOT NULL,
	"started_on" date NOT NULL,
	"ended_on" date,
	"off_boarding_reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placement_id" uuid NOT NULL,
	"author_employer_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"shared_with_others" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "statutory_filings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employer_id" uuid NOT NULL,
	"kind" "filing_kind" NOT NULL,
	"period" text NOT NULL,
	"total_kes" integer NOT NULL,
	"status" "filing_status" DEFAULT 'pending' NOT NULL,
	"reference_number" text,
	"submitted_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"password_hash" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"national_id" text NOT NULL,
	"phone" text NOT NULL,
	"kra_pin" text,
	"nssf_number" text,
	"shif_number" text,
	"role" "worker_role" NOT NULL,
	"home_county" text,
	"vetting" "vetting_status" DEFAULT 'unverified' NOT NULL,
	"vetting_notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employers" ADD CONSTRAINT "employers_primary_user_id_users_id_fk" FOREIGN KEY ("primary_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_placement_id_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_employer_id_employers_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_placement_id_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_employer_id_employers_id_fk" FOREIGN KEY ("author_employer_id") REFERENCES "public"."employers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statutory_filings" ADD CONSTRAINT "statutory_filings_employer_id_employers_id_fk" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_runs_placement_period_idx" ON "payroll_runs" USING btree ("placement_id","period");--> statement-breakpoint
CREATE INDEX "placements_employer_idx" ON "placements" USING btree ("employer_id","status");--> statement-breakpoint
CREATE INDEX "placements_worker_idx" ON "placements" USING btree ("worker_id","status");--> statement-breakpoint
CREATE INDEX "reviews_worker_idx" ON "reviews" USING btree ("worker_id","created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "statutory_filings_employer_kind_period_idx" ON "statutory_filings" USING btree ("employer_id","kind","period");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_idx" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "workers_national_id_idx" ON "workers" USING btree ("national_id");