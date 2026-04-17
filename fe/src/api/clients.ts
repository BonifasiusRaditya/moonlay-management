import { apiClient } from './client';
import { clientSchema } from '@/schemas/client';
import type { Client } from '@/types/client';
import { z } from 'zod';
import { unwrapApiResponse } from '@/utils/apiResponse';

export async function fetchClients(): Promise<Client[]> {
  const response = await apiClient.get('/clients');
  const data = unwrapApiResponse<Client[]>(response.data);
  return data;
}

export async function fetchClient(clientId: number): Promise<Client> {
  const response = await apiClient.get(`/clients/${clientId}`);
  const data = unwrapApiResponse<Client>(response.data);
  return data;
}

export interface CreateClientResult {
  client: Client;
  adminTemporaryPassword?: string | null;
}

export async function createClient(data: z.infer<typeof clientSchema>): Promise<CreateClientResult> {
  const validated = clientSchema.parse(data);
  const response = await apiClient.post('/clients', validated);
  const unwrapped = unwrapApiResponse<unknown>(response.data);
  const responseSchema = z.object({
    id: z.union([z.string(), z.number()]).transform((val) => Number(val)),
    name: z.string(),
    code: z.string(),
    address: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),
    deleted_at: z.string().nullable().optional(),
    admin_temporary_password: z.string().nullable().optional(),
  });

  const parsed = responseSchema.parse(unwrapped);
  return {
    client: {
      id: parsed.id,
      name: parsed.name,
      code: parsed.code,
      address: parsed.address ?? undefined,
      phone: parsed.phone ?? undefined,
      country: parsed.country ?? undefined,
      created_at: parsed.created_at ?? '',
      updated_at: parsed.updated_at ?? '',
      deleted_at: parsed.deleted_at ?? null,
    },
    adminTemporaryPassword: parsed.admin_temporary_password ?? null,
  };
}

export async function updateClient(clientId: number, data: Partial<z.infer<typeof clientSchema>>): Promise<Client> {
  const response = await apiClient.put(`/clients/${clientId}`, data);
  const unwrapped = unwrapApiResponse<unknown>(response.data);
  const responseSchema = z.object({
    id: z.union([z.string(), z.number()]).transform((val) => Number(val)),
    name: z.string(),
    code: z.string(),
    address: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    deleted_at: z.string().nullable().optional(),
  });
  return responseSchema.parse(unwrapped);
}

export async function deleteClient(clientId: number): Promise<void> {
  await apiClient.delete(`/clients/${clientId}`);
}

