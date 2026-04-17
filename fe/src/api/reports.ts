import { apiClient } from './client';

export async function exportAssetsCsv(params?: Record<string, unknown>): Promise<Blob> {
  const response = await apiClient.get('/reports/assets/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
}

export async function exportAssignmentsCsv(params?: Record<string, unknown>): Promise<Blob> {
  const response = await apiClient.get('/reports/assignments/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
}

export async function exportDevicesCsv(params?: Record<string, unknown>): Promise<Blob> {
  const response = await apiClient.get('/reports/devices/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
}


