import { z } from 'zod';
import type { Client } from '@/types/client';

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
  admin_email: z.string().email('Invalid admin email'),
  admin_password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

export type { Client };

