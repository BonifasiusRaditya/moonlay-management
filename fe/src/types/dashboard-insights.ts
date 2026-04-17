export interface DashboardInsights {
  unused_assets_count: number;
  unused_assets_cost_sum: number;
  unused_rented_assets_count: number;
  unused_license_seats_total: number;
  licenses_expiring_30d_count: number;
  licenses_expired_count: number;
  sla_breached_count: number;
  sla_open_at_risk_count: number;
  sla_compliance_rate: number;
  software_policy_violations_count: number;
  warranty_expiring_30d_count: number;
  warranty_expired_count: number;
  critical_devices_count: number;
  under_repair_over_14d_count: number;
  under_repair_over_30d_count: number;
}
