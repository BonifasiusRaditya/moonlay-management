import { apiClient } from './client';
import type { DashboardStats } from '@/types/dashboard_stats';
import type { DeviceHealthIssue } from '@/types/device_health_issue';
import type { DashboardInsights } from '@/types/dashboard-insights';
import { unwrapApiResponse } from '@/utils/apiResponse';

export type { DashboardStats, DeviceHealthIssue };
export type { DashboardInsights };

export async function fetchProblemDevices(): Promise<DeviceHealthIssue[]> {
  const response = await apiClient.get('/dashboard/problem-devices');
  return unwrapApiResponse<DeviceHealthIssue[]>(response.data);
}

export interface AssetStatusCount {
  status: 'available' | 'assigned' | 'under_repair' | 'retired';
  count: number;
}

export interface DeviceStatusCount {
  status: 'online' | 'offline';
  count: number;
}

export interface DeviceHealthCount {
  status: 'healthy' | 'warning' | 'critical';
  count: number;
}

export async function fetchAssetStatusCount(): Promise<AssetStatusCount[]> {
  const response = await apiClient.get('/dashboard/asset-status');
  return unwrapApiResponse<AssetStatusCount[]>(response.data);
}

export async function fetchDeviceStatusCount(): Promise<DeviceStatusCount[]> {
  const response = await apiClient.get('/dashboard/device-status');
  return unwrapApiResponse<DeviceStatusCount[]>(response.data);
}

export async function fetchDeviceHealthCount(): Promise<DeviceHealthCount[]> {
  const response = await apiClient.get('/dashboard/device-health');
  return unwrapApiResponse<DeviceHealthCount[]>(response.data);
}

export async function fetchDashboardInsights(): Promise<DashboardInsights> {
  const response = await apiClient.get('/dashboard/insights');
  return unwrapApiResponse<DashboardInsights>(response.data);
}

