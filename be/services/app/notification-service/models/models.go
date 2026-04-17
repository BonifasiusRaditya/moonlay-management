package models

import "time"

type Notification struct {
	ID           string     `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	RecipientSub string     `gorm:"column:recipient_sub" json:"recipientSub"`
	Title        string     `json:"title"`
	Body         string     `json:"body"`
	Status       string     `json:"status"`
	ReadAt       *time.Time `gorm:"column:read_at" json:"readAt"`
	CreatedAt    time.Time  `gorm:"column:created_at" json:"createdAt"`
}

func (Notification) TableName() string {
	return "notif.notifications"
}
