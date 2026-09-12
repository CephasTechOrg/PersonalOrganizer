CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uidx" ON "users" USING btree ("email");
--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
CREATE INDEX "opportunities_user_idx" ON "opportunities" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "tasks_user_idx" ON "tasks" USING btree ("user_id");
