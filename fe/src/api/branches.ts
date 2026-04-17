import { apiClient } from './client';
import { branchSchema } from '@/schemas/branch';
import type { Branch } from '@/types/branch';
import { z } from 'zod';
import { unwrapApiResponse } from '@/utils/apiResponse';

export async function fetchBranches(clientId?: number | null): Promise<Branch[]> {
  const params = clientId != null ? { client_id: clientId } : {};
  const response = await apiClient.get('/branches', { params });
  const data = unwrapApiResponse<Branch[]>(response.data);
  return data;
}

export async function fetchBranch(branchId: number): Promise<Branch> {
  const response = await apiClient.get(`/branches/${branchId}`);
  const data = unwrapApiResponse<Branch>(response.data);
  return data;
}

export async function createBranch(data: z.infer<typeof branchSchema>): Promise<Branch> {
  const validated = branchSchema.parse(data);
  const response = await apiClient.post('/branches', validated);
  const unwrapped = unwrapApiResponse<unknown>(response.data);
  const responseSchema = z.object({
    id: z.union([z.string(), z.number()]).transform((val) => Number(val)),
    client_id: z.number(),
    name: z.string(),
    code: z.string(),
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    deleted_at: z.string().nullable().optional(),
  });
  return responseSchema.parse(unwrapped) as Branch;
}

export async function updateBranch(branchId: number, data: Partial<z.infer<typeof branchSchema>>): Promise<Branch> {
  const response = await apiClient.put(`/branches/${branchId}`, data);
  const unwrapped = unwrapApiResponse<unknown>(response.data);
  const responseSchema = z.object({
    id: z.union([z.string(), z.number()]).transform((val) => Number(val)),
    client_id: z.number(),
    name: z.string(),
    code: z.string(),
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    deleted_at: z.string().nullable().optional(),
  });
  return responseSchema.parse(unwrapped) as Branch;
}

export async function deleteBranch(branchId: number): Promise<void> {
  await apiClient.delete(`/branches/${branchId}`);
}

