import { z } from 'zod';

/**
 * Only non-secret, public config belongs in VITE_* (bundled into the client).
 * JWT signing secrets must never live here — they remain backend-only.
 *
 * Platform login path/key are obscurity controls for operators, not real secrets
 * (anything VITE_* is visible in the built JS).
 */
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_WITHDRAWAL_MODE: z.enum(['instant', 'scheduled']).default('scheduled'),
  /** Non-public path for Sadaka super-admin login (default: /ops/login). */
  VITE_PLATFORM_LOGIN_PATH: z.preprocess(
    (value) => (value === '' || value == null ? undefined : value),
    z
      .string()
      .regex(/^\/[A-Za-z0-9/_-]*$/, 'VITE_PLATFORM_LOGIN_PATH must be an absolute path')
      .default('/ops/login'),
  ),
  /**
   * Optional soft gate: when set, platform login requires ?access=<key>
   * (or a session grant after a successful access). Empty = path-only obscurity.
   */
  VITE_PLATFORM_LOGIN_KEY: z.preprocess(
    (value) => (value == null ? '' : String(value)),
    z.string().default(''),
  ),
});

export type AppEnv = z.infer<typeof envSchema>;

export const env: AppEnv = envSchema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_WITHDRAWAL_MODE: import.meta.env.VITE_WITHDRAWAL_MODE,
  VITE_PLATFORM_LOGIN_PATH: import.meta.env.VITE_PLATFORM_LOGIN_PATH,
  VITE_PLATFORM_LOGIN_KEY: import.meta.env.VITE_PLATFORM_LOGIN_KEY,
});
