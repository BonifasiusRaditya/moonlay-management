import { z } from 'zod';
import type { Branch } from '@/types/branch';

export const branchSchema = z.object({
  client_id: z.number().int().positive('Please select a client'),
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export type { Branch };

