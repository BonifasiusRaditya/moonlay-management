package repositories

import (
	"time"

	"digisign-portal/services/app/notification-service/models"

	"gorm.io/gorm"
)

type Repository struct {
	DB *gorm.DB
}

func New(db *gorm.DB) *Repository {
	return &Repository{DB: db}
}

func (r *Repository) ListByRecipient(sub string, offset int, limit int) ([]models.Notification, int64, error) {
	query := r.DB.Model(&models.Notification{}).Where("recipient_sub = ?", sub)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var notifications []models.Notification
	if err := query.Order("created_at desc").Limit(limit).Offset(offset).Find(&notifications).Error; err != nil {
		return nil, 0, err
	}

	return notifications, total, nil
}

func (r *Repository) MarkRead(id string, sub string, now time.Time) error {
	return r.DB.Model(&models.Notification{}).
		Where("id = ? AND recipient_sub = ?", id, sub).
		Updates(map[string]any{
			"status":  "read",
			"read_at": now,
		}).Error
}

func (r *Repository) FindByIDAndRecipient(id string, sub string) (models.Notification, error) {
	var notification models.Notification
	err := r.DB.First(&notification, "id = ? AND recipient_sub = ?", id, sub).Error
	return notification, err
}

func (r *Repository) MarkReadAll(sub string, now time.Time) error {
	return r.DB.Model(&models.Notification{}).
		Where("recipient_sub = ? AND status = ?", sub, "unread").
		Updates(map[string]any{
			"status":  "read",
			"read_at": now,
		}).Error
}
