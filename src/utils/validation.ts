import { z } from 'zod';
import { isValidKenyanPhone, normalizePhone } from './phone';

export const kenyanPhoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine(isValidKenyanPhone, 'Phone must be a valid Kenyan number (e.g. 0712345678 or 254712345678)');

export const loginSchema = z.object({
  phone: kenyanPhoneSchema,
  password: z.string().min(1, 'Password is required')
});

export const otpCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'OTP code must be a 6-digit number')
});

export const churchInfoSchema = z.object({
  name: z.string().trim().min(2, 'Church name is required'),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-z0-9-]+$/, 'Username can only contain lowercase letters, numbers, and hyphens'),
  phone: kenyanPhoneSchema,
  email: z.string().trim().email('Invalid email address').optional().or(z.literal(''))
});

export const adminAccountSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must include an uppercase letter')
      .regex(/[a-z]/, 'Password must include a lowercase letter')
      .regex(/[0-9]/, 'Password must include a number'),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v, 'You must accept terms and conditions')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export const withdrawalSetupSchema = z.object({
  withdrawal_method: z.enum(['phone', 'till', 'paybill']),
  withdrawal_number: z.string().trim().min(3, 'Withdrawal number is required')
});
