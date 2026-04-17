package auditlog

import (
	"time"

	"gorm.io/gorm"
)

type Event struct {
	ID        string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ActorType string         `gorm:"not null"`
	ActorID   string         `gorm:"not null"`
	Action    string         `gorm:"not null"`
	TargetType string        `gorm:"column:target_type"`
	TargetID  string         `gorm:"column:target_id"`
	Metadata  map[string]any `gorm:"type:jsonb"`
	IPAddress string         `gorm:"column:ip_address"`
	UserAgent string         `gorm:"column:user_agent"`
	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime"`
}

func (Event) TableName() string {
	return "audit.audit_events"
}

func Log(db *gorm.DB, event *Event) error {
	if db == nil {
		return nil
	}
	return db.Create(event).Error
}
