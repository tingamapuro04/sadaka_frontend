import { z } from 'zod';

/**
 * Only non-secret, public config belongs in VITE_* (bundled into the client).
 * JWT signing secrets must never live here — they remain backend-only.
 */
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_WITHDRAWAL_MODE: z.enum(['instant', 'scheduled']).default('scheduled')
});

export type AppEnv = z.infer<typeof envSchema>;

export const env: AppEnv = envSchema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_WITHDRAWAL_MODE: import.meta.env.VITE_WITHDRAWAL_MODE
});
