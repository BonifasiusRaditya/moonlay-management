package routes

import (
	"net/http"
	"time"

	"digisign-portal/services/app/core-service/controllers"
	"digisign-portal/services/app/core-service/middleware"
	"digisign-portal/services/app/core-service/repositories"
	"digisign-portal/services/app/core-service/usecases"

	"github.com/labstack/echo/v4"
	echoSwagger "github.com/swaggo/echo-swagger"
	"gorm.io/gorm"
)

func ConfigureRouter(e *echo.Echo, serviceName string, db *gorm.DB) {
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]any{
			"status":    "ok",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})

	e.GET("/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"status":  "ok",
			"service": serviceName,
		})
	})

	v1 := e.Group("/api/v1")
	v1.GET("/swagger/*", echoSwagger.WrapHandler)

	authRepo := repositories.NewAuthRepository(db)
	authUsecase := usecases.NewAuthUsecase(authRepo)
	authController := controllers.NewAuthController(authUsecase)
	authMW := middleware.NewAuthMiddleware(authUsecase.TokenSecret())
	financeController := controllers.NewFinanceController(usecases.NewFinanceUsecase())
	clientController := controllers.NewClientController(usecases.NewClientUsecase(repositories.NewClientRepository(db), repositories.NewUserRepository(db), repositories.NewRBACRepository(db)))
	branchController := controllers.NewBranchController(usecases.NewBranchUsecase(repositories.NewBranchRepository(db), repositories.NewClientRepository(db)))
	userController := controllers.NewUserController(usecases.NewUserUsecase(repositories.NewUserRepository(db), repositories.NewClientRepository(db), repositories.NewBranchRepository(db)))
	rbacController := controllers.NewRBACController(usecases.NewRBACUsecase(repositories.NewRBACRepository(db), repositories.NewUserRepository(db)))
	employeeController := controllers.NewEmployeeController(usecases.NewEmployeeUsecase(repositories.NewEmployeeRepository(db), repositories.NewClientRepository(db), repositories.NewBranchRepository(db)))
	apiKeyController := controllers.NewApiKeyController(usecases.NewApiKeyUsecase(repositories.NewApiKeyRepository(db)))
	auditLogController := controllers.NewAuditLogController(usecases.NewAuditLogUsecase(repositories.NewAuditLogRepository(db)))
	dashboardController := controllers.NewDashboardController(usecases.NewDashboardUsecase())
	reportController := controllers.NewReportController(usecases.NewReportUsecase())

	v1.POST("/auth/login", authController.Login)
	v1.POST("/auth/logout", authController.Logout)
	v1.POST("/auth/register", authController.Register, authMW.RequireAnyRole("superadmin", "admin"))
	v1.GET("/auth/me", authController.Me, authMW.RequireAuth())
	v1.POST("/auth/refresh-token", authController.RefreshToken)
	v1.POST("/auth/forgot-password", authController.ForgotPassword)
	v1.POST("/auth/reset-password", authController.ResetPassword)

	clients := v1.Group("/clients", authMW.RequireAuth())
	clients.GET("", clientController.List)
	clients.GET("/:clientId", clientController.Get)
	clients.POST("", clientController.Create, authMW.RequireAnyRole("superadmin", "admin"))
	clients.PUT("/:clientId", clientController.Update, authMW.RequireAnyRole("superadmin", "admin"))
	clients.DELETE("/:clientId", clientController.Delete, authMW.RequireAnyRole("superadmin", "admin"))

	branches := v1.Group("/branches", authMW.RequireAuth())
	branches.GET("", branchController.List)
	branches.GET("/:branchId", branchController.Get)
	branches.POST("", branchController.Create, authMW.RequireAnyRole("superadmin", "admin"))
	branches.PUT("/:branchId", branchController.Update, authMW.RequireAnyRole("superadmin", "admin"))
	branches.DELETE("/:branchId", branchController.Delete, authMW.RequireAnyRole("superadmin", "admin"))

	users := v1.Group("/users", authMW.RequireAuth())
	users.GET("", userController.List)
	users.GET("/:id", userController.Get)
	users.POST("", userController.Create, authMW.RequireAnyRole("superadmin", "admin"))
	users.PUT("/:id", userController.Update, authMW.RequireAnyRole("superadmin", "admin"))
	users.PUT("/:id/password", userController.ChangePassword)
	users.DELETE("/:id", userController.Delete, authMW.RequireAnyRole("superadmin", "admin"))

	rbac := v1.Group("/rbac", authMW.RequireAuth(), authMW.RequireAnyRole("superadmin", "admin"))
	rbac.GET("/permissions", rbacController.ListPermissions)
	rbac.GET("/roles", rbacController.ListRoles)
	rbac.POST("/roles", rbacController.CreateRole)
	rbac.PUT("/roles/:roleId", rbacController.UpdateRole)
	rbac.DELETE("/roles/:roleId", rbacController.DeleteRole)
	rbac.GET("/roles/:roleId/permissions", rbacController.GetRolePermissions)
	rbac.PUT("/roles/:roleId/permissions", rbacController.SetRolePermissions)
	rbac.PUT("/users/:userId/role", rbacController.AssignUserRole)

	employees := v1.Group("/employees", authMW.RequireAuth())
	employees.GET("", employeeController.List)
	employees.GET("/client/:clientId", employeeController.ListByClient)
	employees.GET("/branch/:branchId", employeeController.ListByBranch)
	employees.GET("/:id", employeeController.Get)
	employees.POST("", employeeController.Create, authMW.RequireAnyRole("superadmin", "admin"))
	employees.PUT("/:id", employeeController.Update, authMW.RequireAnyRole("superadmin", "admin"))
	employees.DELETE("/:id", employeeController.Delete, authMW.RequireAnyRole("superadmin", "admin"))

	apiKeys := v1.Group("/api-keys", authMW.RequireAuth())
	apiKeys.POST("", apiKeyController.Create, authMW.RequireAnyRole("superadmin", "admin"))
	apiKeys.GET("", apiKeyController.List)
	apiKeys.GET("/:id", apiKeyController.Get)
	apiKeys.PUT("/:id", apiKeyController.Update, authMW.RequireAnyRole("superadmin", "admin"))
	apiKeys.POST("/:id/invalidate", apiKeyController.Invalidate, authMW.RequireAnyRole("superadmin", "admin"))
	apiKeys.DELETE("/:id", apiKeyController.Delete, authMW.RequireAnyRole("superadmin", "admin"))

	auditLogs := v1.Group("/audit-logs", authMW.RequireAuth(), authMW.RequireAnyRole("superadmin", "admin"))
	auditLogs.GET("", auditLogController.ListByClient)
	auditLogs.GET("/table/:tableName", auditLogController.ListByTable)
	auditLogs.GET("/:logId", auditLogController.Get)

	dashboard := v1.Group("/dashboard", authMW.RequireAuth())
	dashboard.GET("", dashboardController.Summary)
	dashboard.GET("/asset-status", dashboardController.AssetStatus)
	dashboard.GET("/device-status", dashboardController.DeviceStatus)
	dashboard.GET("/device-health", dashboardController.DeviceHealth)
	dashboard.GET("/problem-devices", dashboardController.ProblemDevices)
	dashboard.GET("/insights", dashboardController.Insights)

	reports := v1.Group("/reports", authMW.RequireAuth())
	reports.GET("", reportController.List)
	reports.GET("/assets/export", reportController.ExportAssets)
	reports.GET("/assignments/export", reportController.ExportAssignments)
	reports.GET("/devices/export", reportController.ExportDevices)

	finance := v1.Group("/finance", authMW.RequireAuth())
	finance.POST("/import-document", financeController.ImportDocument)
}
