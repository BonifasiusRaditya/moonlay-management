package repositories

import (
	"errors"
	"strings"
	"time"

	"digisign-portal/services/app/core-service/models"

	"gorm.io/gorm"
)

type EmployeeRepository struct{ db *gorm.DB }
type ApiKeyRepository struct{ db *gorm.DB }
type AuditLogRepository struct{ db *gorm.DB }

func NewEmployeeRepository(db *gorm.DB) *EmployeeRepository { return &EmployeeRepository{db: db} }
func NewApiKeyRepository(db *gorm.DB) *ApiKeyRepository { return &ApiKeyRepository{db: db} }
func NewAuditLogRepository(db *gorm.DB) *AuditLogRepository { return &AuditLogRepository{db: db} }

func (r *EmployeeRepository) FindAll(clientID *uint, branchID *uint) ([]models.Employee, error) {
	var out []models.Employee
	q := r.db.Where("deleted_at IS NULL")
	if clientID != nil { q = q.Where("client_id = ?", *clientID) }
	if branchID != nil { q = q.Where("branch_id = ?", *branchID) }
	return out, q.Order("id ASC").Find(&out).Error
}

func (r *EmployeeRepository) FindByID(id uint) (*models.Employee, error) {
	var item models.Employee
	err := r.db.Where("id = ? AND deleted_at IS NULL", id).First(&item).Error
	if errors.Is(err, gorm.ErrRecordNotFound) { return nil, nil }
	if err != nil { return nil, err }
	return &item, nil
}

func (r *EmployeeRepository) FindByEmail(email string) (*models.Employee, error) {
	var item models.Employee
	err := r.db.Where("LOWER(email) = ? AND deleted_at IS NULL", strings.ToLower(strings.TrimSpace(email))).First(&item).Error
	if errors.Is(err, gorm.ErrRecordNotFound) { return nil, nil }
	if err != nil { return nil, err }
	return &item, nil
}

func (r *EmployeeRepository) Create(item *models.Employee) error { return r.db.Create(item).Error }
func (r *EmployeeRepository) Update(id uint, updates map[string]any) error {
	updates["updated_at"] = time.Now().UTC()
	return r.db.Model(&models.Employee{}).Where("id = ? AND deleted_at IS NULL", id).Updates(updates).Error
}
func (r *EmployeeRepository) Delete(id uint) error {
	return r.db.Model(&models.Employee{}).Where("id = ? AND deleted_at IS NULL", id).Update("deleted_at", time.Now().UTC()).Error
}

func (r *ApiKeyRepository) FindByID(id uint) (*models.ApiKey, error) {
	var item models.ApiKey
	err := r.db.Where("id = ? AND deleted_at IS NULL", id).First(&item).Error
	if errors.Is(err, gorm.ErrRecordNotFound) { return nil, nil }
	if err != nil { return nil, err }
	return &item, nil
}

func (r *ApiKeyRepository) FindByClientID(clientID uint) ([]models.ApiKey, error) {
	var out []models.ApiKey
	return out, r.db.Where("client_id = ? AND deleted_at IS NULL", clientID).Order("id DESC").Find(&out).Error
}

func (r *ApiKeyRepository) FindAllActive() ([]models.ApiKey, error) {
	var out []models.ApiKey
	return out, r.db.Where("deleted_at IS NULL AND is_active = true").Find(&out).Error
}

func (r *ApiKeyRepository) Create(item *models.ApiKey) error { return r.db.Create(item).Error }

func (r *ApiKeyRepository) Update(id uint, updates map[string]any) error {
	updates["updated_at"] = time.Now().UTC()
	return r.db.Model(&models.ApiKey{}).Where("id = ? AND deleted_at IS NULL", id).Updates(updates).Error
}

func (r *ApiKeyRepository) Delete(id uint) error {
	return r.db.Model(&models.ApiKey{}).Where("id = ? AND deleted_at IS NULL", id).Update("deleted_at", time.Now().UTC()).Error
}

func (r *ApiKeyRepository) UpdateLastUsed(id uint) error {
	return r.db.Model(&models.ApiKey{}).Where("id = ?", id).Update("last_used_at", time.Now().UTC()).Error
}

func (r *AuditLogRepository) ByID(id uint) (*models.AuditLog, error) {
	var item models.AuditLog
	err := r.db.Where("id = ?", id).First(&item).Error
	if errors.Is(err, gorm.ErrRecordNotFound) { return nil, nil }
	if err != nil { return nil, err }
	return &item, nil
}

func (r *AuditLogRepository) ByTable(table string, recordID *uint) ([]models.AuditLog, error) {
	var out []models.AuditLog
	q := r.db.Where("table_name = ?", table)
	if recordID != nil { q = q.Where("record_id = ?", *recordID) }
	return out, q.Order("created_at DESC").Find(&out).Error
}

func (r *AuditLogRepository) ByClient(clientID uint, page int, limit int) ([]models.AuditLog, int64, error) {
	if page < 1 { page = 1 }
	if limit <= 0 { limit = 50 }
	offset := (page - 1) * limit
	q := r.db.Model(&models.AuditLog{}).Where("client_id = ?", clientID)
	var total int64
	if err := q.Count(&total).Error; err != nil { return nil, 0, err }
	var out []models.AuditLog
	if err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&out).Error; err != nil { return nil, 0, err }
	return out, total, nil
}
