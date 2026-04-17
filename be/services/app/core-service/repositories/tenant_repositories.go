package repositories

import (
	"errors"
	"strings"
	"time"

	"digisign-portal/services/app/core-service/models"

	"gorm.io/gorm"
)

type ClientRepository struct{ db *gorm.DB }
type BranchRepository struct{ db *gorm.DB }
type UserRepository struct{ db *gorm.DB }
type RBACRepository struct{ db *gorm.DB }

func NewClientRepository(db *gorm.DB) *ClientRepository { return &ClientRepository{db: db} }
func NewBranchRepository(db *gorm.DB) *BranchRepository { return &BranchRepository{db: db} }
func NewUserRepository(db *gorm.DB) *UserRepository { return &UserRepository{db: db} }
func NewRBACRepository(db *gorm.DB) *RBACRepository { return &RBACRepository{db: db} }

func (r *ClientRepository) FindAll(clientID *uint) ([]models.Client, error) {
	var out []models.Client
	q := r.db.Where("deleted_at IS NULL")
	if clientID != nil {
		q = q.Where("id = ?", *clientID)
	}
	return out, q.Order("id ASC").Find(&out).Error
}

func (r *ClientRepository) FindByID(id uint) (*models.Client, error) {
	var c models.Client
	err := r.db.Where("id = ? AND deleted_at IS NULL", id).First(&c).Error
	if errors.Is(err, gorm.ErrRecordNotFound) { return nil, nil }
	if err != nil { return nil, err }
	return &c, nil
}

func (r *ClientRepository) FindByCode(code string) (*models.Client, error) {
	var c models.Client
	err := r.db.Where("LOWER(code) = ? AND deleted_at IS NULL", strings.ToLower(strings.TrimSpace(code))).First(&c).Error
	if errors.Is(err, gorm.ErrRecordNotFound) { return nil, nil }
	if err != nil { return nil, err }
	return &c, nil
}

func (r *ClientRepository) Create(in models.CreateClientInput) (*models.Client, error) {
	item := models.Client{Name: strings.TrimSpace(in.Name), Code: strings.TrimSpace(in.Code), Address: in.Address, Phone: in.Phone, Email: in.Email, Country: in.Country}
	if err := r.db.Create(&item).Error; err != nil { return nil, err }
	return &item, nil
}

func (r *ClientRepository) Update(id uint, in models.UpdateClientInput) (*models.Client, error) {
	updates := map[string]any{"updated_at": time.Now().UTC()}
	if in.Name != nil { updates["name"] = strings.TrimSpace(*in.Name) }
	if in.Code != nil { updates["code"] = strings.TrimSpace(*in.Code) }
	if in.Address != nil { updates["address"] = in.Address }
	if in.Phone != nil { updates["phone"] = in.Phone }
	if in.Email != nil { updates["email"] = in.Email }
	if in.Country != nil { updates["country"] = in.Country }
	if err := r.db.Model(&models.Client{}).Where("id = ? AND deleted_at IS NULL", id).Updates(updates).Error; err != nil { return nil, err }
	return r.FindByID(id)
}

func (r *ClientRepository) Delete(id uint) error {
	return r.db.Model(&models.Client{}).Where("id = ? AND deleted_at IS NULL", id).Update("deleted_at", time.Now().UTC()).Error
}

func (r *BranchRepository) FindAll(clientID *uint) ([]models.Branch, error) {
	var out []models.Branch
	q := r.db.Where("deleted_at IS NULL")
	if clientID != nil { q = q.Where("client_id = ?", *clientID) }
	return out, q.Order("id ASC").Find(&out).Error
}

func (r *BranchRepository) FindByID(id uint) (*models.Branch, error) {
	var b models.Branch
	err := r.db.Where("id = ? AND deleted_at IS NULL", id).First(&b).Error
	if errors.Is(err, gorm.ErrRecordNotFound) { return nil, nil }
	if err != nil { return nil, err }
	return &b, nil
}

func (r *BranchRepository) Create(in models.CreateBranchInput) (*models.Branch, error) {
	item := models.Branch{ClientID: in.ClientID, Name: strings.TrimSpace(in.Name), Code: strings.TrimSpace(in.Code), Address: in.Address, City: in.City, Country: in.Country, Timezone: in.Timezone}
	if err := r.db.Create(&item).Error; err != nil { return nil, err }
	return &item, nil
}

func (r *BranchRepository) Update(id uint, in models.UpdateBranchInput) (*models.Branch, error) {
	updates := map[string]any{"updated_at": time.Now().UTC()}
	if in.ClientID != nil { updates["client_id"] = *in.ClientID }
	if in.Name != nil { updates["name"] = strings.TrimSpace(*in.Name) }
	if in.Code != nil { updates["code"] = strings.TrimSpace(*in.Code) }
	if in.Address != nil { updates["address"] = in.Address }
	if in.City != nil { updates["city"] = in.City }
	if in.Country != nil { updates["country"] = in.Country }
	if in.Timezone != nil { updates["timezone"] = in.Timezone }
	if err := r.db.Model(&models.Branch{}).Where("id = ? AND deleted_at IS NULL", id).Updates(updates).Error; err != nil { return nil, err }
	return r.FindByID(id)
}

func (r *BranchRepository) Delete(id uint) error {
	return r.db.Model(&models.Branch{}).Where("id = ? AND deleted_at IS NULL", id).Update("deleted_at", time.Now().UTC()).Error
}

func (r *UserRepository) FindAll(clientID *uint) ([]models.ManagedUser, error) {
	var out []models.ManagedUser
	q := r.db.Where("deleted_at IS NULL")
	if clientID != nil { q = q.Where("client_id = ?", *clientID) }
	return out, q.Order("id ASC").Find(&out).Error
}

func (r *UserRepository) FindByID(id uint) (*models.ManagedUser, error) {
	var u models.ManagedUser
	err := r.db.Where("id = ? AND deleted_at IS NULL", id).First(&u).Error
	if errors.Is(err, gorm.ErrRecordNotFound) { return nil, nil }
	if err != nil { return nil, err }
	return &u, nil
}

func (r *UserRepository) FindByEmail(email string) (*models.ManagedUser, error) {
	var u models.ManagedUser
	err := r.db.Where("LOWER(email) = ? AND deleted_at IS NULL", strings.ToLower(strings.TrimSpace(email))).First(&u).Error
	if errors.Is(err, gorm.ErrRecordNotFound) { return nil, nil }
	if err != nil { return nil, err }
	return &u, nil
}

func (r *UserRepository) Create(item *models.ManagedUser) error { return r.db.Create(item).Error }

func (r *UserRepository) Update(id uint, updates map[string]any) error {
	updates["updated_at"] = time.Now().UTC()
	return r.db.Model(&models.ManagedUser{}).Where("id = ? AND deleted_at IS NULL", id).Updates(updates).Error
}

func (r *UserRepository) Delete(id uint) error {
	return r.db.Model(&models.ManagedUser{}).Where("id = ? AND deleted_at IS NULL", id).Update("deleted_at", time.Now().UTC()).Error
}

func (r *RBACRepository) ListPermissions(includeHidden bool) ([]models.Permission, error) {
	var out []models.Permission
	q := r.db.Where("deleted_at IS NULL")
	if !includeHidden { q = q.Where("is_hidden = false") }
	return out, q.Order("key ASC").Find(&out).Error
}

func (r *RBACRepository) ListRoles(clientID *uint) ([]models.Role, error) {
	var out []models.Role
	q := r.db.Where("deleted_at IS NULL")
	if clientID == nil {
		q = q.Where("client_id IS NULL")
	} else {
		q = q.Where("client_id = ?", *clientID)
	}
	return out, q.Order("id ASC").Find(&out).Error
}

func (r *RBACRepository) FindRoleByID(id uint) (*models.Role, error) {
	var role models.Role
	err := r.db.Where("id = ? AND deleted_at IS NULL", id).First(&role).Error
	if errors.Is(err, gorm.ErrRecordNotFound) { return nil, nil }
	if err != nil { return nil, err }
	return &role, nil
}

func (r *RBACRepository) FindRoleByKey(clientID *uint, key string) (*models.Role, error) {
	var role models.Role
	q := r.db.Where("key = ? AND deleted_at IS NULL", strings.TrimSpace(key))
	if clientID == nil { q = q.Where("client_id IS NULL") } else { q = q.Where("client_id = ?", *clientID) }
	err := q.First(&role).Error
	if errors.Is(err, gorm.ErrRecordNotFound) { return nil, nil }
	if err != nil { return nil, err }
	return &role, nil
}

func (r *RBACRepository) CreateRole(role *models.Role) error { return r.db.Create(role).Error }

func (r *RBACRepository) UpdateRole(id uint, updates map[string]any) error {
	updates["updated_at"] = time.Now().UTC()
	return r.db.Model(&models.Role{}).Where("id = ? AND deleted_at IS NULL", id).Updates(updates).Error
}

func (r *RBACRepository) DeleteRole(id uint) error {
	return r.db.Model(&models.Role{}).Where("id = ? AND deleted_at IS NULL", id).Update("deleted_at", time.Now().UTC()).Error
}

func (r *RBACRepository) GetRolePermissionKeys(roleID uint) ([]string, error) {
	type row struct{ Key string `gorm:"column:key"` }
	var rows []row
	err := r.db.Table("role_permissions rp").
		Select("p.key").
		Joins("JOIN permissions p ON p.id = rp.permission_id AND p.deleted_at IS NULL").
		Where("rp.role_id = ?", roleID).
		Order("p.key ASC").
		Scan(&rows).Error
	if err != nil { return nil, err }
	out := make([]string, 0, len(rows))
	for _, item := range rows { out = append(out, item.Key) }
	return out, nil
}

func (r *RBACRepository) SetRolePermissions(roleID uint, permissionKeys []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("DELETE FROM role_permissions WHERE role_id = ?", roleID).Error; err != nil {
			return err
		}
		if len(permissionKeys) == 0 { return nil }
		type perm struct{ ID uint `gorm:"column:id"` }
		var perms []perm
		if err := tx.Table("permissions").Select("id").Where("key IN ? AND deleted_at IS NULL", permissionKeys).Find(&perms).Error; err != nil {
			return err
		}
		for _, p := range perms {
			if err := tx.Exec("INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES (?, ?, now()) ON CONFLICT (role_id, permission_id) DO NOTHING", roleID, p.ID).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
