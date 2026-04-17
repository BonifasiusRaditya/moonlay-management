package usecases

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"digisign-portal/services/app/core-service/models"
	"digisign-portal/services/app/core-service/repositories"

	"golang.org/x/crypto/bcrypt"
)

type EmployeeUsecase struct{ repo *repositories.EmployeeRepository; clients *repositories.ClientRepository; branches *repositories.BranchRepository }
type ApiKeyUsecase struct{ repo *repositories.ApiKeyRepository }
type AuditLogUsecase struct{ repo *repositories.AuditLogRepository }
type DashboardUsecase struct{}
type ReportUsecase struct{}

func NewEmployeeUsecase(repo *repositories.EmployeeRepository, clients *repositories.ClientRepository, branches *repositories.BranchRepository) *EmployeeUsecase {
	return &EmployeeUsecase{repo: repo, clients: clients, branches: branches}
}
func NewApiKeyUsecase(repo *repositories.ApiKeyRepository) *ApiKeyUsecase { return &ApiKeyUsecase{repo: repo} }
func NewAuditLogUsecase(repo *repositories.AuditLogRepository) *AuditLogUsecase { return &AuditLogUsecase{repo: repo} }
func NewDashboardUsecase() *DashboardUsecase { return &DashboardUsecase{} }
func NewReportUsecase() *ReportUsecase { return &ReportUsecase{} }

func (u *EmployeeUsecase) List(actorClientID uint, actorRole string, byClient *uint, byBranch *uint) ([]models.Employee, error) {
	if actorRole == "superadmin" { return u.repo.FindAll(byClient, byBranch) }
	return u.repo.FindAll(&actorClientID, byBranch)
}

func (u *EmployeeUsecase) Get(id uint, actorClientID uint, actorRole string) (*models.Employee, error) {
	item, err := u.repo.FindByID(id)
	if err != nil || item == nil { return nil, errors.New("employee not found") }
	if actorRole != "superadmin" && item.ClientID != actorClientID { return nil, errors.New("forbidden") }
	return item, nil
}

func (u *EmployeeUsecase) Create(input models.CreateEmployeeInput, actorClientID uint, actorRole string) (*models.Employee, error) {
	if strings.TrimSpace(input.Name) == "" || strings.TrimSpace(input.Email) == "" { return nil, errors.New("name and email are required") }
	if actorRole != "superadmin" { input.ClientID = actorClientID }
	if input.ClientID == 0 { return nil, errors.New("client_id is required") }
	if c, err := u.clients.FindByID(input.ClientID); err != nil { return nil, err } else if c == nil { return nil, errors.New("client not found") }
	if input.BranchID != nil {
		if b, err := u.branches.FindByID(*input.BranchID); err != nil { return nil, err } else if b == nil || b.ClientID != input.ClientID { return nil, errors.New("invalid branch") }
	}
	if existing, err := u.repo.FindByEmail(input.Email); err != nil { return nil, err } else if existing != nil { return nil, errors.New("employee with this email already exists") }
	status := strings.TrimSpace(strings.ToLower(input.Status))
	if status == "" { status = "active" }
	item := &models.Employee{Name: strings.TrimSpace(input.Name), Email: strings.ToLower(strings.TrimSpace(input.Email)), ClientID: input.ClientID, BranchID: input.BranchID, Status: status}
	if err := u.repo.Create(item); err != nil { return nil, err }
	return item, nil
}

func (u *EmployeeUsecase) Update(id uint, input models.UpdateEmployeeInput, actorClientID uint, actorRole string) (*models.Employee, error) {
	item, err := u.repo.FindByID(id)
	if err != nil || item == nil { return nil, errors.New("employee not found") }
	if actorRole != "superadmin" && item.ClientID != actorClientID { return nil, errors.New("forbidden") }
	updates := map[string]any{}
	if input.Name != nil { updates["name"] = strings.TrimSpace(*input.Name) }
	if input.Email != nil {
		existing, err := u.repo.FindByEmail(*input.Email)
		if err != nil { return nil, err }
		if existing != nil && existing.ID != item.ID { return nil, errors.New("employee with this email already exists") }
		updates["email"] = strings.ToLower(strings.TrimSpace(*input.Email))
	}
	if input.Status != nil { updates["status"] = strings.ToLower(strings.TrimSpace(*input.Status)) }
	if input.ClientID != nil {
		if actorRole != "superadmin" { return nil, errors.New("forbidden") }
		updates["client_id"] = *input.ClientID
	}
	if input.BranchID != nil { updates["branch_id"] = *input.BranchID }
	if err := u.repo.Update(id, updates); err != nil { return nil, err }
	return u.repo.FindByID(id)
}

func (u *EmployeeUsecase) Delete(id uint, actorClientID uint, actorRole string) error {
	item, err := u.repo.FindByID(id)
	if err != nil { return err }
	if item == nil { return errors.New("employee not found") }
	if actorRole != "superadmin" && item.ClientID != actorClientID { return errors.New("forbidden") }
	return u.repo.Delete(id)
}

func (u *ApiKeyUsecase) Create(input models.CreateApiKeyInput, actorClientID uint, actorRole string, actorUserID uint) (map[string]any, error) {
	if actorRole != "superadmin" { input.ClientID = actorClientID }
	if input.ClientID == 0 { return nil, errors.New("client_id is required") }
	raw := generateAPIKey()
	hash, _ := bcrypt.GenerateFromPassword([]byte(raw), bcrypt.DefaultCost)
	prefix := raw
	if len(prefix) > 8 { prefix = prefix[:8] }
	item := &models.ApiKey{ClientID: input.ClientID, KeyHash: string(hash), KeyPrefix: prefix, Name: input.Name, ExpiresAt: input.ExpiresAt, IsActive: true, CreatedBy: &actorUserID}
	if err := u.repo.Create(item); err != nil { return nil, err }
	return map[string]any{"id": item.ID, "client_id": item.ClientID, "key": raw, "key_prefix": item.KeyPrefix, "name": item.Name, "expires_at": item.ExpiresAt, "is_active": item.IsActive, "created_at": item.CreatedAt}, nil
}

func (u *ApiKeyUsecase) GetByID(id uint, actorClientID uint, actorRole string) (*models.ApiKey, error) {
	item, err := u.repo.FindByID(id)
	if err != nil || item == nil { return nil, errors.New("api key not found") }
	if actorRole != "superadmin" && item.ClientID != actorClientID { return nil, errors.New("forbidden") }
	return item, nil
}

func (u *ApiKeyUsecase) ListByClient(clientID uint, actorClientID uint, actorRole string) ([]models.ApiKey, error) {
	if actorRole != "superadmin" && clientID != actorClientID { return nil, errors.New("forbidden") }
	return u.repo.FindByClientID(clientID)
}

func (u *ApiKeyUsecase) Update(id uint, input models.UpdateApiKeyInput, actorClientID uint, actorRole string) (*models.ApiKey, error) {
	item, err := u.repo.FindByID(id)
	if err != nil || item == nil { return nil, errors.New("api key not found") }
	if actorRole != "superadmin" && item.ClientID != actorClientID { return nil, errors.New("forbidden") }
	updates := map[string]any{}
	if input.Name != nil { updates["name"] = input.Name }
	if input.ExpiresAt != nil {
		if input.ExpiresAt.Before(time.Now().UTC()) { return nil, errors.New("expiration date cannot be in the past") }
		updates["expires_at"] = *input.ExpiresAt
	}
	if input.IsActive != nil { updates["is_active"] = *input.IsActive }
	if err := u.repo.Update(id, updates); err != nil { return nil, err }
	return u.repo.FindByID(id)
}

func (u *ApiKeyUsecase) Invalidate(id uint, actorClientID uint, actorRole string) error {
	item, err := u.repo.FindByID(id)
	if err != nil || item == nil { return errors.New("api key not found") }
	if actorRole != "superadmin" && item.ClientID != actorClientID { return errors.New("forbidden") }
	return u.repo.Update(id, map[string]any{"is_active": false})
}

func (u *ApiKeyUsecase) Delete(id uint, actorClientID uint, actorRole string) error {
	item, err := u.repo.FindByID(id)
	if err != nil || item == nil { return errors.New("api key not found") }
	if actorRole != "superadmin" && item.ClientID != actorClientID { return errors.New("forbidden") }
	return u.repo.Delete(id)
}

func (u *AuditLogUsecase) GetByID(id uint) (*models.AuditLog, error) {
	item, err := u.repo.ByID(id)
	if err != nil || item == nil { return nil, errors.New("audit log not found") }
	return item, nil
}

func (u *AuditLogUsecase) ByTable(table string, recordID *uint) ([]models.AuditLog, error) {
	return u.repo.ByTable(table, recordID)
}

func (u *AuditLogUsecase) ByClient(clientID uint, page int, limit int) (map[string]any, error) {
	logs, total, err := u.repo.ByClient(clientID, page, limit)
	if err != nil { return nil, err }
	totalPages := 0
	if limit > 0 {
		totalPages = int((total + int64(limit) - 1) / int64(limit))
	}
	return map[string]any{"logs": logs, "total": total, "page": page, "limit": limit, "totalPages": totalPages}, nil
}

func (u *DashboardUsecase) Summary() map[string]any {
	return map[string]any{"message": "dashboard_placeholder", "asset_status": []any{}, "device_status": []any{}, "device_health": []any{}, "problem_devices": map[string]any{"top_cpu": []any{}, "top_ram": []any{}, "top_disk": []any{}}, "insights": map[string]any{"unusedAssetsCount": 0, "unusedAssetsCostSum": 0, "unusedRentedAssetsCount": 0, "unusedLicenseSeatsTotal": 0, "licensesExpiring30dCount": 0, "licensesExpiredCount": 0, "slaBreachedCount": 0, "slaOpenAtRiskCount": 0, "slaComplianceRate": 0, "softwarePolicyViolationsCount": 0, "warrantyExpiring30dCount": 0, "warrantyExpiredCount": 0, "criticalDevicesCount": 0, "underRepairOver14dCount": 0, "underRepairOver30dCount": 0}}
}

func (u *DashboardUsecase) AssetStatus() []map[string]any { return []map[string]any{{"status": "available", "count": 0}, {"status": "assigned", "count": 0}, {"status": "under_repair", "count": 0}, {"status": "retired", "count": 0}} }
func (u *DashboardUsecase) DeviceStatus() []map[string]any { return []map[string]any{{"status": "online", "count": 0}, {"status": "offline", "count": 0}} }
func (u *DashboardUsecase) DeviceHealth() []map[string]any { return []map[string]any{{"status": "healthy", "count": 0}, {"status": "warning", "count": 0}, {"status": "critical", "count": 0}} }
func (u *DashboardUsecase) ProblemDevices() map[string]any { return map[string]any{"top_cpu": []any{}, "top_ram": []any{}, "top_disk": []any{}} }
func (u *DashboardUsecase) Insights() map[string]any { return u.Summary()["insights"].(map[string]any) }

func (u *ReportUsecase) ExportAssets() string { return "message\nreport_assets_placeholder\n" }
func (u *ReportUsecase) ExportAssignments() string { return "message\nreport_assignments_placeholder\n" }
func (u *ReportUsecase) ExportDevices() string { return "message\nreport_devices_placeholder\n" }

func generateAPIKey() string {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil { return "novaris_temp_key" }
	return "novaris_" + hex.EncodeToString(buf)
}
