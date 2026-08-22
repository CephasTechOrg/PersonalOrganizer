CREATE TYPE "public"."audit_entity" AS ENUM('opportunity', 'task', 'auth');--> statement-breakpoint
CREATE TYPE "public"."opportunity_status" AS ENUM('saved', 'need_to_apply', 'in_progress', 'applied', 'waiting', 'interview', 'accepted', 'rejected', 'withdrawn', 'archived');--> statement-breakpoint
CREATE TYPE "public"."opportunity_type" AS ENUM('internship', 'fellowship', 'program', 'startup_program', 'funding', 'competition', 'event', 'other');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_kind" AS ENUM('apply', 'download', 'review', 'contact', 'attend', 'complete', 'other');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'done', 'cancelled');--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"organization" text,
	"type" "opportunity_type" DEFAULT 'program' NOT NULL,
	"status" "opportunity_status" DEFAULT 'saved' NOT NULL,
	"priority" "priority" DEFAULT 'normal' NOT NULL,
	"source_url" text,
	"application_url" text,
	"description" text,
	"notes" text,
	"next_action" text,
	"location" text,
	"is_remote" boolean,
	"deadline_at" timestamp with time zone,
	"follow_up_at" timestamp with time zone,
	"applied_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid,
	"title" text NOT NULL,
	"notes" text,
	"kind" "task_kind" DEFAULT 'complete' NOT NULL,
	"action_url" text,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"priority" "priority" DEFAULT 'normal' NOT NULL,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "audit_entity" NOT NULL,
	"entity_id" uuid,
	"action" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_throttles" (
	"key" text PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"blocked_until" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "opportunities_status_idx" ON "opportunities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "opportunities_type_idx" ON "opportunities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "opportunities_deadline_idx" ON "opportunities" USING btree ("deadline_at");--> statement-breakpoint
CREATE INDEX "opportunities_follow_up_idx" ON "opportunities" USING btree ("follow_up_at");--> statement-breakpoint
CREATE INDEX "opportunities_created_idx" ON "opportunities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tasks_opportunity_idx" ON "tasks" USING btree ("opportunity_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_kind_idx" ON "tasks" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "tasks_due_idx" ON "tasks" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");