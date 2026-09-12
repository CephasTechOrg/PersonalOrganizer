import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";

config({ path: ".env.local" });
config();

async function main() {
  const schema = z.object({
    DATABASE_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(32),
    OWNER_EMAIL: z.string().email().optional(),
    OWNER_PASSWORD_HASH: z.string().startsWith("scrypt:").optional(),
  });

  const env = schema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    OWNER_EMAIL: process.env.OWNER_EMAIL || undefined,
    OWNER_PASSWORD_HASH: process.env.OWNER_PASSWORD_HASH || undefined,
  });

  const sql = neon(env.DATABASE_URL);
  await sql`select 1 as ok`;

  const users = await sql`select count(*)::int as count from users`;
  const userCount = users[0]?.count ?? 0;
  if (userCount === 0) {
    console.error(
      "No users found. Run `npm run db:migrate` then `npm run auth:bootstrap` (requires OWNER_EMAIL + OWNER_PASSWORD_HASH).",
    );
    process.exit(1);
  }

  console.log(`Deployment check passed: environment and database are valid (${userCount} user(s)).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
