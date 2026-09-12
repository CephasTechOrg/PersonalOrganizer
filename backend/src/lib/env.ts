import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  /** Used only by bootstrap / create-owner seed; login reads users from the database. */
  OWNER_EMAIL: z
    .string()
    .email()
    .transform((value) => value.toLowerCase())
    .optional(),
  OWNER_PASSWORD_HASH: z.string().startsWith("scrypt:").optional(),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | undefined;

export function getEnv(): ServerEnv {
  if (cached) return cached;

  cached = envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    OWNER_EMAIL: process.env.OWNER_EMAIL || undefined,
    OWNER_PASSWORD_HASH: process.env.OWNER_PASSWORD_HASH || undefined,
  });

  return cached;
}
