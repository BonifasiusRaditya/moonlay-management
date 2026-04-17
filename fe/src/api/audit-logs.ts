import { apiClient } from './client';
import { unwrapApiResponse } from '@/utils/apiResponse';
import { z } from 'zod';

const auditLogSchema = z
  .object({
    id: z.number(),
    table_name: z.string().nullable().optional(),
    record_id: z.number().nullable().optional(),
    action: z.string().nullable().optional(),
    user_id: z.number().nullable().optional(),
    client_id: z.number().nullable().optional(),
    branch_id: z.number().nullable().optional(),
    old_value: z.unknown().nullable().optional(),
    new_value: z.unknown().nullable().optional(),
    changes: z.unknown().nullable().optional(),
    created_at: z.string(),
  })
  .passthrough();

export type AuditLog = z.infer<typeof auditLogSchema>;

export async function fetchAuditLogs(params?: { limit?: number | null }) {
  const filteredParams = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== null)
  );
  const response = await apiClient.get('/audit-logs', {
    params: filteredParams,
  });
  const data = unwrapApiResponse<unknown>(response.data);
  return z.array(auditLogSchema).parse(data);
}

export async function fetchAuditLogsByTable(tableName: string, params?: { limit?: number | null }) {
  const filteredParams = Object.fromEntries(
    Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== null)
  );
  const response = await apiClient.get(`/audit-logs/table/${tableName}`, {
    params: filteredParams,
  });
  const data = unwrapApiResponse<unknown>(response.data);
  return z.array(auditLogSchema).parse(data);
}

export async function fetchAuditLogById(logId: number) {
  const response = await apiClient.get(`/audit-logs/${logId}`);
  const data = unwrapApiResponse<unknown>(response.data);
  return auditLogSchema.parse(data);
}


