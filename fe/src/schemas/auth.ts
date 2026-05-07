import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  client_id: z.coerce.number().int().positive('Client ID is required'),
  branch_id: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return value;
  }, z.coerce.number().int().positive().optional()),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  password_confirmation: z.string().min(1, 'Password confirmation is required'),
  role: z.string().min(1, 'Role is required'),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Passwords do not match',
  path: ['password_confirmation'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

