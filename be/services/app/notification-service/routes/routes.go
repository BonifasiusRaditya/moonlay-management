package routes

import (
	"net/http"

	"digisign-portal/services/app/notification-service/controllers"
	"digisign-portal/services/app/notification-service/repositories"
	"digisign-portal/services/app/notification-service/usecases"
	"digisign-portal/services/pkg/sharedauth"

	"github.com/labstack/echo/v4"
	echoSwagger "github.com/swaggo/echo-swagger"
	"github.com/spf13/viper"
	"gorm.io/gorm"
)

func ConfigureRouter(e *echo.Echo, serviceName string, db *gorm.DB) {
	e.GET("/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"status":  "ok",
			"service": serviceName,
		})
	})

	v1 := e.Group("/api/v1")
	v1.GET("/swagger/*", echoSwagger.WrapHandler)

	repo := repositories.New(db)
	usecaseLayer := usecases.New(repo)
	handler := controllers.New(usecaseLayer)
	authCfg := sharedauth.Config{
		JWKSURL:  viper.GetString("AUTH_JWKS_URL"),
		Issuer:   viper.GetString("AUTH_ISSUER"),
		Audience: viper.GetString("AUTH_AUDIENCE"),
	}

	portal := v1.Group("/portal/notifications", sharedauth.AuthMiddleware(authCfg), sharedauth.RequireAnyRole("portal_user", "portal_admin"))
	portal.GET("", handler.ListNotifications)
	portal.POST("/:notificationId/read", handler.MarkRead)
	portal.POST("/read-all", handler.MarkReadAll)
}
