import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  OWNER_EMAIL: z.string().email().transform((value) => value.toLowerCase()),
  OWNER_PASSWORD_HASH: z.string().startsWith("scrypt:"),
  AUTH_SECRET: z.string().min(32),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | undefined;

export function getEnv(): ServerEnv {
  if (cached) return cached;

  cached = envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    OWNER_EMAIL: process.env.OWNER_EMAIL,
    OWNER_PASSWORD_HASH: process.env.OWNER_PASSWORD_HASH,
    AUTH_SECRET: process.env.AUTH_SECRET,
  });

  return cached;
}
