import { config } from "dotenv";
import { count, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../src/db/schema";

config({ path: ".env.local" });
config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();
  const ownerHash = process.env.OWNER_PASSWORD_HASH;

  if (!databaseUrl) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }
  if (!ownerEmail || !ownerHash?.startsWith("scrypt:")) {
    console.error("OWNER_EMAIL and OWNER_PASSWORD_HASH are required to bootstrap the first user.");
    process.exit(1);
  }

  const client = neon(databaseUrl);
  const db = drizzle(client, { schema });

  const [{ value: userCount }] = await db.select({ value: count() }).from(schema.users);

  let ownerId: string;
  if (userCount === 0) {
    const [created] = await db
      .insert(schema.users)
      .values({
        email: ownerEmail,
        passwordHash: ownerHash,
      })
      .returning();
    ownerId = created.id;
    console.log(`Created owner user: ${ownerEmail}`);
  } else {
    const [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, ownerEmail))
      .limit(1);
    if (!existing) {
      console.error(
        `Users already exist, but OWNER_EMAIL (${ownerEmail}) was not found. Aborting to avoid mis-assigning data.`,
      );
      process.exit(1);
    }
    ownerId = existing.id;
    console.log(`Using existing owner user: ${ownerEmail}`);
  }

  await client`UPDATE opportunities SET user_id = ${ownerId} WHERE user_id IS NULL`;
  await client`UPDATE tasks SET user_id = ${ownerId} WHERE user_id IS NULL`;

  await client`ALTER TABLE "opportunities" ALTER COLUMN "user_id" SET NOT NULL`;
  await client`ALTER TABLE "tasks" ALTER COLUMN "user_id" SET NOT NULL`;

  try {
    await client`
      ALTER TABLE "opportunities"
      ADD CONSTRAINT "opportunities_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
      ON DELETE cascade ON UPDATE no action
    `;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists/i.test(message)) throw error;
  }

  try {
    await client`
      ALTER TABLE "tasks"
      ADD CONSTRAINT "tasks_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
      ON DELETE cascade ON UPDATE no action
    `;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists/i.test(message)) throw error;
  }

  const [{ value: orphanOpps }] = await db
    .select({ value: count() })
    .from(schema.opportunities)
    .where(sql`${schema.opportunities.userId} IS NULL`);
  const [{ value: orphanTasks }] = await db
    .select({ value: count() })
    .from(schema.tasks)
    .where(sql`${schema.tasks.userId} IS NULL`);

  if (orphanOpps > 0 || orphanTasks > 0) {
    console.error(`Backfill incomplete: ${orphanOpps} opportunities, ${orphanTasks} tasks still unassigned.`);
    process.exit(1);
  }

  console.log("Multi-user bootstrap complete: existing data assigned to owner; user_id is NOT NULL.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
