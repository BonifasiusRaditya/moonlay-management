package repositories

import (
	"strings"
	"time"

	"digisign-portal/services/app/audit-service/models"

	"gorm.io/gorm"
)

type Repository struct {
	DB *gorm.DB
}

func New(db *gorm.DB) *Repository {
	return &Repository{DB: db}
}

type DashboardMetrics struct {
	TotalSigning      int64
	SignedCount       int64
	ActiveCertificates int64
	PendingRA         int64
	AvgSigningTimeMs  int64
}

func (r *Repository) ListAuditEvents(actorID string, action string, startDate string, endDate string, offset int, limit int) ([]models.AuditEvent, int64, error) {
	query := r.DB.Model(&models.AuditEvent{})
	if actorID != "" {
		query = query.Where("actor_id = ?", strings.TrimSpace(actorID))
	}
	if action != "" {
		query = query.Where("action = ?", strings.TrimSpace(action))
	}
	if startDate != "" {
		if parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(startDate)); err == nil {
			query = query.Where("created_at >= ?", parsed)
		}
	}
	if endDate != "" {
		if parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(endDate)); err == nil {
			query = query.Where("created_at <= ?", parsed)
		}
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var events []models.AuditEvent
	if err := query.Order("created_at desc").Limit(limit).Offset(offset).Find(&events).Error; err != nil {
		return nil, 0, err
	}

	return events, total, nil
}

func (r *Repository) GetDashboardMetrics() (DashboardMetrics, error) {
	metrics := DashboardMetrics{}

	if err := r.DB.Raw("SELECT COUNT(*) FROM signing.signing_requests").Scan(&metrics.TotalSigning).Error; err != nil {
		return metrics, err
	}
	if err := r.DB.Raw("SELECT COUNT(*) FROM signing.signing_requests WHERE status = 'SIGNED'").Scan(&metrics.SignedCount).Error; err != nil {
		return metrics, err
	}
	if err := r.DB.Raw("SELECT COUNT(*) FROM ca.certificates WHERE status = 'ACTIVE'").Scan(&metrics.ActiveCertificates).Error; err != nil {
		return metrics, err
	}
	if err := r.DB.Raw("SELECT COUNT(*) FROM ra.subscribers WHERE status = 'PENDING'").Scan(&metrics.PendingRA).Error; err != nil {
		return metrics, err
	}
	if err := r.DB.Raw("SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) * 1000), 0) FROM signing.signing_requests WHERE status = 'SIGNED' AND completed_at IS NOT NULL").Scan(&metrics.AvgSigningTimeMs).Error; err != nil {
		return metrics, err
	}

	return metrics, nil
}

func (r *Repository) ListRecentEvents(limit int) ([]models.AuditEvent, error) {
	var events []models.AuditEvent
	err := r.DB.Order("created_at desc").Limit(limit).Find(&events).Error
	return events, err
}
