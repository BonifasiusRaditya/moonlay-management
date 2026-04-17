package usecases

import (
	"net/http"
	"strings"
	"time"

	"digisign-portal/services/app/audit-service/repositories"
	"digisign-portal/services/pkg/httputil"

	"github.com/labstack/echo/v4"
)

type Usecase struct {
	Repo *repositories.Repository
}

func New(repo *repositories.Repository) *Usecase {
	return &Usecase{Repo: repo}
}

func (u *Usecase) ListAuditEvents(c echo.Context) error {
	page, pageSize, offset, limit := httputil.ParsePagination(c, 50)
	actorID := strings.TrimSpace(c.QueryParam("actorId"))
	action := strings.TrimSpace(c.QueryParam("action"))
	startDate := strings.TrimSpace(c.QueryParam("startDate"))
	endDate := strings.TrimSpace(c.QueryParam("endDate"))

	events, total, err := u.Repo.ListAuditEvents(actorID, action, startDate, endDate, offset, limit)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]any{
		"page":     page,
		"pageSize": pageSize,
		"total":    total,
		"items":    events,
	})
}

func (u *Usecase) DashboardMetrics(c echo.Context) error {
	metrics, err := u.Repo.GetDashboardMetrics()
	if err != nil {
		return err
	}

	successRate := 0.0
	if metrics.TotalSigning > 0 {
		successRate = float64(metrics.SignedCount) / float64(metrics.TotalSigning) * 100
	}

	return c.JSON(http.StatusOK, map[string]any{
		"totalSigningRequests": metrics.TotalSigning,
		"successRate":          successRate,
		"avgSigningTimeMs":     metrics.AvgSigningTimeMs,
		"activeCertificates":   metrics.ActiveCertificates,
		"pendingRaReviews":     metrics.PendingRA,
	})
}

func (u *Usecase) DashboardActivity(c echo.Context) error {
	limit := httputil.ParseLimit(c, 10)
	events, err := u.Repo.ListRecentEvents(limit)
	if err != nil {
		return err
	}

	items := make([]map[string]any, 0, len(events))
	for _, event := range events {
		resource := strings.TrimSpace(event.TargetType)
		if event.TargetID != "" {
			resource = resource + ":" + event.TargetID
		}
		items = append(items, map[string]any{
			"id":        event.ID,
			"actor":     event.ActorID,
			"action":    event.Action,
			"resource":  strings.TrimSpace(resource),
			"status":    "success",
			"timestamp": event.CreatedAt.Format(time.RFC3339),
		})
	}

	return c.JSON(http.StatusOK, map[string]any{"items": items})
}
