package controllers

import (
	"digisign-portal/services/app/notification-service/usecases"

	"github.com/labstack/echo/v4"
)

type Controller struct {
	Usecase *usecases.Usecase
}

func New(usecaseLayer *usecases.Usecase) *Controller {
	return &Controller{Usecase: usecaseLayer}
}

// ListNotifications godoc
// @Summary List portal notifications
// @Tags Notifications
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /portal/notifications [get]
func (cctl *Controller) ListNotifications(c echo.Context) error {
	return cctl.Usecase.ListNotifications(c)
}

// MarkRead godoc
// @Summary Mark one notification as read
// @Tags Notifications
// @Produce json
// @Security BearerAuth
// @Param notificationId path string true "Notification ID"
// @Success 200 {object} map[string]interface{}
// @Router /portal/notifications/{notificationId}/read [post]
func (cctl *Controller) MarkRead(c echo.Context) error {
	return cctl.Usecase.MarkRead(c, c.Param("notificationId"))
}

// MarkReadAll godoc
// @Summary Mark all notifications as read
// @Tags Notifications
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /portal/notifications/read-all [post]
func (cctl *Controller) MarkReadAll(c echo.Context) error {
	return cctl.Usecase.MarkReadAll(c)
}
