import { apiClient } from './client';
import { unwrapApiResponse } from '@/utils/apiResponse';
import { z } from 'zod';

const roleSchema = z
  .object({
    id: z.number(),
    client_id: z.number().nullable().optional(),
    key: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    permissions: z.array(z.string()).nullable().optional(),
  })
  .passthrough();

export type Role = z.infer<typeof roleSchema>;

export async function fetchPermissions(): Promise<string[]> {
  const response = await apiClient.get('/rbac/permissions');
  const data = unwrapApiResponse<unknown>(response.data);
  return z.array(z.string()).parse(data);
}

export async function fetchRoles(): Promise<Role[]> {
  const response = await apiClient.get('/rbac/roles');
  const data = unwrapApiResponse<unknown>(response.data);
  return z.array(roleSchema).parse(data);
}

export async function fetchRolePermissions(roleId: number): Promise<string[]> {
  const response = await apiClient.get(`/rbac/roles/${roleId}/permissions`);
  const data = unwrapApiResponse<unknown>(response.data);
  return z.array(z.string()).parse(data);
}

export async function createRole(payload: { key: string; name: string; description?: string | null }) {
  const response = await apiClient.post('/rbac/roles', payload);
  const data = unwrapApiResponse<unknown>(response.data);
  return roleSchema.parse(data);
}

export async function updateRole(
  roleId: number,
  payload: { key?: string; name?: string; description?: string | null }
) {
  const response = await apiClient.put(`/rbac/roles/${roleId}`, payload);
  const data = unwrapApiResponse<unknown>(response.data);
  return roleSchema.parse(data);
}

export async function deleteRole(roleId: number): Promise<void> {
  await apiClient.delete(`/rbac/roles/${roleId}`);
}

export async function setRolePermissions(roleId: number, permissions: string[]): Promise<void> {
  await apiClient.put(`/rbac/roles/${roleId}/permissions`, { permissions });
}

export async function assignUserRole(userId: number, role: string): Promise<void> {
  await apiClient.put(`/rbac/users/${userId}/role`, { role });
}


