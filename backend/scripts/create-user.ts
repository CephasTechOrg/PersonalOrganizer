import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../src/db/schema";
import { hashPassword } from "../src/lib/password";

config({ path: ".env.local" });
config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const rl = createInterface({ input, output });
  const emailRaw = await rl.question("New user email: ");
  const password = await rl.question("Password (minimum 12 characters): ");
  rl.close();

  const email = emailRaw.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    console.error("A valid email is required.");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }

  const client = neon(databaseUrl);
  const db = drizzle(client, { schema });

  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  if (existing) {
    console.error(`A user with email ${email} already exists.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(schema.users)
    .values({ email, passwordHash })
    .returning({ id: schema.users.id, email: schema.users.email });

  console.log(`Created user ${created.email} (${created.id}). They can sign in at /login with an empty hub.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
