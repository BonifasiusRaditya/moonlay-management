package routes

import (
	"net/http"

	"digisign-portal/services/app/audit-service/controllers"
	"digisign-portal/services/app/audit-service/repositories"
	"digisign-portal/services/app/audit-service/usecases"
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

	admin := v1.Group("/admin", sharedauth.AuthMiddleware(authCfg), sharedauth.RequireAnyRole("admin_super", "admin_audit", "admin_ops"))
	admin.GET("/audit/events", handler.ListAuditEvents)
	admin.GET("/dashboard/metrics", handler.DashboardMetrics)
	admin.GET("/dashboard/activity", handler.DashboardActivity)
}
