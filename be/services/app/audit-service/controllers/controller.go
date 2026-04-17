package controllers

import (
	"digisign-portal/services/app/audit-service/usecases"

	"github.com/labstack/echo/v4"
)

type Controller struct {
	Usecase *usecases.Usecase
}

func New(usecaseLayer *usecases.Usecase) *Controller {
	return &Controller{Usecase: usecaseLayer}
}

// ListAuditEvents godoc
// @Summary List audit events
// @Tags Audit
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /admin/audit/events [get]
func (cctl *Controller) ListAuditEvents(c echo.Context) error {
	return cctl.Usecase.ListAuditEvents(c)
}

// DashboardMetrics godoc
// @Summary Get dashboard metrics
// @Tags Audit Dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /admin/dashboard/metrics [get]
func (cctl *Controller) DashboardMetrics(c echo.Context) error {
	return cctl.Usecase.DashboardMetrics(c)
}

// DashboardActivity godoc
// @Summary Get dashboard activity
// @Tags Audit Dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /admin/dashboard/activity [get]
func (cctl *Controller) DashboardActivity(c echo.Context) error {
	return cctl.Usecase.DashboardActivity(c)
}
