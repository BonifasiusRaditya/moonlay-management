import { apiClient } from './client';
import { z } from 'zod';
import type { User } from '@/types/user';
import { unwrapApiResponse } from '@/utils/apiResponse';

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').nullable().optional(),
  role: z.enum(['admin', 'staff', 'viewer'], {
    errorMap: () => ({ message: 'Role must be admin, staff, or viewer' }),
  }),
  client_id: z.number().int().positive('Client ID is required'),
  branch_id: z.number().int().positive().nullable().optional(),
  must_change_password: z.boolean().nullable().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').nullable().optional(),
  role: z.enum(['admin', 'staff', 'viewer']).nullable().optional(),
  branch_id: z.number().int().positive().nullable().optional(),
  must_change_password: z.boolean().nullable().optional(),
});

export type { User };

export async function fetchUser(userId: string): Promise<User> {
  const response = await apiClient.get(`/users/${userId}`);
  const unwrapped = unwrapApiResponse<unknown>(response.data);
  const responseSchema = z.object({
    id: z.union([z.string(), z.number()]).transform((val) => String(val)),
    name: z.string(),
    email: z.string().email(),
    role: z.string().nullable().optional(),
    client_id: z.number().nullable().optional(),
    branch_id: z.number().nullable().optional(),
    client: z.object({
      id: z.number(),
      name: z.string(),
      code: z.string(),
    }).nullable().optional(),
    branch: z.object({
      id: z.number(),
      name: z.string(),
      code: z.string(),
    }).nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    must_change_password: z.boolean().nullable().optional(),
  });
  const parsed = responseSchema.parse(unwrapped);
  return {
    id: parsed.id,
    name: parsed.name,
    email: parsed.email,
    role: parsed.role,
    client_id: parsed.client_id,
    branch_id: parsed.branch_id,
    client: parsed.client,
    branch: parsed.branch,
    createdAt: parsed.created_at,
    updatedAt: parsed.updated_at,
    must_change_password: parsed.must_change_password,
  };
}

export async function fetchUsers(): Promise<User[]> {
  const response = await apiClient.get('/users');
  const unwrapped = unwrapApiResponse<unknown>(response.data);
  const responseSchema = z.array(
    z.object({
      id: z.union([z.string(), z.number()]).transform((val) => String(val)),
      name: z.string(),
      email: z.string().email(),
      role: z.string().nullable().optional(),
      client_id: z.number().nullable().optional(),
      branch_id: z.number().nullable().optional(),
      client: z.object({
        id: z.number(),
        name: z.string(),
        code: z.string(),
      }).nullable().optional(),
      branch: z.object({
        id: z.number(),
        name: z.string(),
        code: z.string(),
      }).nullable().optional(),
      created_at: z.string(),
      updated_at: z.string(),
      must_change_password: z.boolean().nullable().optional(),
    })
  );
  const parsed = responseSchema.parse(unwrapped);
  return parsed.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    client_id: user.client_id,
    branch_id: user.branch_id,
    client: user.client,
    branch: user.branch,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    must_change_password: user.must_change_password,
  }));
}

export interface CreateUserResult {
  user: User;
  temporaryPassword?: string | null;
}

export async function createUser(data: z.infer<typeof createUserSchema>): Promise<CreateUserResult> {
  const validated = createUserSchema.parse(data);
  const response = await apiClient.post('/users', validated);
  const unwrapped = unwrapApiResponse<unknown>(response.data);
  const responseSchema = z.object({
    id: z.union([z.string(), z.number()]).transform((val) => String(val)),
    name: z.string(),
    email: z.string().email(),
    role: z.string().nullable().optional(),
    client_id: z.number().nullable().optional(),
    branch_id: z.number().nullable().optional(),
    client: z.object({
      id: z.number(),
      name: z.string(),
      code: z.string(),
    }).nullable().optional(),
    branch: z.object({
      id: z.number(),
      name: z.string(),
      code: z.string(),
    }).nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    temporary_password: z.string().nullable().optional(),
    must_change_password: z.boolean().nullable().optional(),
  });
  const parsed = responseSchema.parse(unwrapped);
  return {
    user: {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      role: parsed.role,
      client_id: parsed.client_id,
      branch_id: parsed.branch_id,
      client: parsed.client,
      branch: parsed.branch,
      createdAt: parsed.created_at,
      updatedAt: parsed.updated_at,
      must_change_password: parsed.must_change_password,
    },
    temporaryPassword: parsed.temporary_password ?? null,
  };
}

export async function updateUser(userId: string, data: Partial<z.infer<typeof updateUserSchema>>): Promise<User> {
  const response = await apiClient.put(`/users/${userId}`, data);
  const unwrapped = unwrapApiResponse<unknown>(response.data);
  const responseSchema = z.object({
    id: z.union([z.string(), z.number()]).transform((val) => String(val)),
    name: z.string(),
    email: z.string().email(),
    role: z.string().nullable().optional(),
    client_id: z.number().nullable().optional(),
    branch_id: z.number().nullable().optional(),
    client: z.object({
      id: z.number(),
      name: z.string(),
      code: z.string(),
    }).nullable().optional(),
    branch: z.object({
      id: z.number(),
      name: z.string(),
      code: z.string(),
    }).nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    must_change_password: z.boolean().nullable().optional(),
  });
  const parsed = responseSchema.parse(unwrapped);
  return {
    id: parsed.id,
    name: parsed.name,
    email: parsed.email,
    role: parsed.role,
    client_id: parsed.client_id,
    branch_id: parsed.branch_id,
    client: parsed.client,
    branch: parsed.branch,
    createdAt: parsed.created_at,
    updatedAt: parsed.updated_at,
    must_change_password: parsed.must_change_password,
  };
}

export async function deleteUser(userId: string): Promise<void> {
  await apiClient.delete(`/users/${userId}`);
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  password_confirmation: string;
}

export async function changeUserPassword(userId: string | number, payload: ChangePasswordPayload): Promise<void> {
  await apiClient.put(`/users/${userId}/password`, payload);
}

