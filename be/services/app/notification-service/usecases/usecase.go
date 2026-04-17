package usecases

import (
	"net/http"
	"time"

	"digisign-portal/services/app/notification-service/repositories"
	"digisign-portal/services/pkg/httputil"

	"github.com/labstack/echo/v4"
)

type Usecase struct {
	Repo *repositories.Repository
}

func New(repo *repositories.Repository) *Usecase {
	return &Usecase{Repo: repo}
}

func (u *Usecase) ListNotifications(c echo.Context) error {
	page, pageSize, offset, limit := httputil.ParsePagination(c, 20)
	sub := httputil.ActorID(c)

	notifications, total, err := u.Repo.ListByRecipient(sub, offset, limit)
	if err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]any{
		"page":     page,
		"pageSize": pageSize,
		"total":    total,
		"items":    notifications,
	})
}

func (u *Usecase) MarkRead(c echo.Context, id string) error {
	sub := httputil.ActorID(c)
	now := time.Now()

	if err := u.Repo.MarkRead(id, sub, now); err != nil {
		return err
	}

	notification, err := u.Repo.FindByIDAndRecipient(id, sub)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, notification)
}

func (u *Usecase) MarkReadAll(c echo.Context) error {
	sub := httputil.ActorID(c)
	now := time.Now()
	if err := u.Repo.MarkReadAll(sub, now); err != nil {
		return err
	}

	return c.JSON(http.StatusOK, map[string]any{"ok": true})
}
