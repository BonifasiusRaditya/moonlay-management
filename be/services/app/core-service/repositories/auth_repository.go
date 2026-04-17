package repositories

import (
	"errors"
	"strings"
	"time"

	"digisign-portal/services/app/core-service/models"

	"gorm.io/gorm"
)

type AuthRepository struct {
	db *gorm.DB
}

func NewAuthRepository(db *gorm.DB) *AuthRepository {
	return &AuthRepository{db: db}
}

func (r *AuthRepository) FindUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("LOWER(email) = ? AND deleted_at IS NULL", strings.ToLower(strings.TrimSpace(email))).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *AuthRepository) FindUserByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.Where("id = ? AND deleted_at IS NULL", id).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

func (r *AuthRepository) CreateUser(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *AuthRepository) UpdateLastLogin(userID uint) error {
	now := time.Now().UTC()
	return r.db.Model(&models.User{}).Where("id = ?", userID).Update("last_login_at", now).Error
}

func (r *AuthRepository) UpdatePassword(userID uint, passwordHash string) error {
	return r.db.Model(&models.User{}).
		Where("id = ?", userID).
		Updates(map[string]any{"password_hash": passwordHash, "must_change_password": false, "updated_at": time.Now().UTC()}).Error
}

func (r *AuthRepository) CreatePasswordResetToken(record *models.PasswordResetToken) error {
	return r.db.Create(record).Error
}

func (r *AuthRepository) FindActivePasswordResetToken(token string) (*models.PasswordResetToken, error) {
	var rec models.PasswordResetToken
	err := r.db.Where("token = ? AND used = false AND expires_at > ?", token, time.Now().UTC()).First(&rec).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &rec, nil
}

func (r *AuthRepository) MarkPasswordResetTokenUsed(token string) error {
	return r.db.Model(&models.PasswordResetToken{}).Where("token = ?", token).Update("used", true).Error
}

func (r *AuthRepository) PermissionsForUser(userID uint) ([]string, error) {
	type row struct {
		Key string `gorm:"column:key"`
	}

	var rows []row
	err := r.db.Table("users u").
		Select("p.key").
		Joins("JOIN roles r ON r.key = u.role AND r.deleted_at IS NULL AND (r.client_id = u.client_id OR (u.role = 'superadmin' AND r.client_id IS NULL))").
		Joins("JOIN role_permissions rp ON rp.role_id = r.id").
		Joins("JOIN permissions p ON p.id = rp.permission_id AND p.deleted_at IS NULL").
		Where("u.id = ?", userID).
		Group("p.key").
		Order("p.key ASC").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	res := make([]string, 0, len(rows))
	for _, item := range rows {
		res = append(res, item.Key)
	}
	return res, nil
}
