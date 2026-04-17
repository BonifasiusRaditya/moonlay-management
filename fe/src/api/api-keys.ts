import { apiClient } from './client';
import { unwrapApiResponse } from '@/utils/apiResponse';
import { ApiKey, ApiKeyWithToken, CreateApiKeyDTO, UpdateApiKeyDTO } from '../types/api-key';
import { z } from 'zod';

const apiKeySchema = z.object({
  id: z.number(),
  client_id: z.number(),
  key_prefix: z.string(),
  name: z.string().nullable(),
  expires_at: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  expires_in_days: z.number().nullable(),
});

const apiKeyWithTokenSchema = apiKeySchema.extend({
  key: z.string(),
});

export async function createApiKey(data: CreateApiKeyDTO): Promise<ApiKeyWithToken> {
  const response = await apiClient.post('/api-keys', {
    client_id: data.client_id,
    name: data.name,
    expires_at: data.expires_at,
  });
  const unwrapped = unwrapApiResponse<unknown>(response.data);
  return apiKeyWithTokenSchema.parse(unwrapped);
}

export async function getApiKeys(clientId?: number): Promise<ApiKey[]> {
  const params = clientId ? { client_id: clientId } : {};
  const response = await apiClient.get('/api-keys', { params });
  const data = unwrapApiResponse<ApiKey[]>(response.data);
  return data;
}

export async function getApiKeyById(id: number): Promise<ApiKey> {
  const response = await apiClient.get(`/api-keys/${id}`);
  const data = unwrapApiResponse<ApiKey>(response.data);
  return data;
}

export async function updateApiKey(id: number, data: UpdateApiKeyDTO): Promise<ApiKey> {
  const response = await apiClient.put(`/api-keys/${id}`, {
    name: data.name,
    expires_at: data.expires_at,
    is_active: data.is_active,
  });
  const unwrapped = unwrapApiResponse<unknown>(response.data);
  return apiKeySchema.parse(unwrapped);
}

export async function invalidateApiKey(id: number): Promise<void> {
  await apiClient.post(`/api-keys/${id}/invalidate`);
}

export async function deleteApiKey(id: number): Promise<void> {
  await apiClient.delete(`/api-keys/${id}`);
}

