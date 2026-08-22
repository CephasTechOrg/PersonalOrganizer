import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { z } from "zod";

config({ path: ".env.local" });
config();

async function main() {
  const schema = z.object({
    DATABASE_URL: z.string().min(1),
    OWNER_EMAIL: z.string().email(),
    OWNER_PASSWORD_HASH: z.string().startsWith("scrypt:"),
    AUTH_SECRET: z.string().min(32),
  });

  const env = schema.parse(process.env);
  const sql = neon(env.DATABASE_URL);
  await sql`select 1 as ok`;
  console.log("Deployment check passed: environment and database are valid.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
