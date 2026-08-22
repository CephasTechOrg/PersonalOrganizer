import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { getEnv } from "@/lib/env";
import * as schema from "@/db/schema";

let database: NeonHttpDatabase<typeof schema> | undefined;

export function getDb() {
  if (database) return database;

  const sql = neon(getEnv().DATABASE_URL);
  database = drizzle({ client: sql, schema });
  return database;
}
