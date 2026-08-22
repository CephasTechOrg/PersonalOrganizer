ALTER TABLE "opportunities" ADD COLUMN "open_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "opportunities_open_idx" ON "opportunities" USING btree ("open_at");