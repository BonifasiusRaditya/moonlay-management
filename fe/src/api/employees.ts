import { apiClient } from './client';
import { z } from 'zod';
import { unwrapApiResponse } from '@/utils/apiResponse';

export const employeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  status: z.enum(['active', 'inactive']),
  client_id: z.number(),
  branch_id: z.number().nullable().optional(),
  active_assignment_count: z.number().optional().default(0),
  active_license_count: z.number().optional().default(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  email: z.string().email('Invalid email format').max(100, 'Email must be less than 100 characters'),
  client_id: z.number().int().positive('Client ID is required'),
  branch_id: z.number().int().positive().nullable().optional(),
  status: z.enum(['active', 'inactive']).nullable().optional(),
});

export const updateEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters').optional(),
  email: z.string().email('Invalid email format').max(100, 'Email must be less than 100 characters').optional(),
  client_id: z.number().int().positive().optional(),
  branch_id: z.number().int().positive().nullable().optional(),
  status: z.enum(['active', 'inactive']).nullable().optional(),
});

export type Employee = z.infer<typeof employeeSchema> & {
  client?: {
    id: number;
    name: string;
    code: string;
  } | null;
  branch?: {
    id: number;
    name: string;
    code: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  active_assignment_count: number;
  active_license_count: number;
};

export async function fetchEmployee(employeeId: string): Promise<Employee> {
  const response = await apiClient.get(`/employees/${employeeId}`);
  const unwrapped = unwrapApiResponse<Employee>(response.data);
  return unwrapped;
}

export async function fetchEmployees(): Promise<Employee[]> {
  const response = await apiClient.get('/employees');
  const unwrapped = unwrapApiResponse<Employee[]>(response.data);
  return unwrapped;
}

export async function createEmployee(data: z.infer<typeof createEmployeeSchema>): Promise<Employee> {
  const validated = createEmployeeSchema.parse(data);
  const response = await apiClient.post('/employees', validated);
  const unwrapped = unwrapApiResponse<Employee>(response.data);
  return unwrapped;
}

export async function updateEmployee(employeeId: string, data: Partial<z.infer<typeof updateEmployeeSchema>>): Promise<Employee> {
  const response = await apiClient.put(`/employees/${employeeId}`, data);
  const unwrapped = unwrapApiResponse<Employee>(response.data);
  return unwrapped;
}

export async function deleteEmployee(employeeId: string): Promise<void> {
  await apiClient.delete(`/employees/${employeeId}`);
}

