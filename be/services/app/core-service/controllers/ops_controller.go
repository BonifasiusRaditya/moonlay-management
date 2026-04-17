package controllers

import (
	"net/http"
	"strconv"

	"digisign-portal/services/app/core-service/models"
	"digisign-portal/services/app/core-service/usecases"

	"github.com/labstack/echo/v4"
)

type EmployeeController struct{ usecase *usecases.EmployeeUsecase }
type ApiKeyController struct{ usecase *usecases.ApiKeyUsecase }
type AuditLogController struct{ usecase *usecases.AuditLogUsecase }
type DashboardController struct{ usecase *usecases.DashboardUsecase }
type ReportController struct{ usecase *usecases.ReportUsecase }

func NewEmployeeController(uc *usecases.EmployeeUsecase) *EmployeeController {
	return &EmployeeController{usecase: uc}
}
func NewApiKeyController(uc *usecases.ApiKeyUsecase) *ApiKeyController {
	return &ApiKeyController{usecase: uc}
}
func NewAuditLogController(uc *usecases.AuditLogUsecase) *AuditLogController {
	return &AuditLogController{usecase: uc}
}
func NewDashboardController(uc *usecases.DashboardUsecase) *DashboardController {
	return &DashboardController{usecase: uc}
}
func NewReportController(uc *usecases.ReportUsecase) *ReportController {
	return &ReportController{usecase: uc}
}

// List godoc
// @Summary List employees
// @Tags Employees
// @Produce json
// @Security BearerAuth
// @Param client_id query int false "Client ID"
// @Param branch_id query int false "Branch ID"
// @Success 200 {object} map[string]interface{}
// @Router /employees [get]
func (ctl *EmployeeController) List(c echo.Context) error {
	var byClient *uint
	if raw := c.QueryParam("client_id"); raw != "" {
		if n, err := strconv.ParseUint(raw, 10, 64); err == nil {
			v := uint(n)
			byClient = &v
		}
	}
	var byBranch *uint
	if raw := c.QueryParam("branch_id"); raw != "" {
		if n, err := strconv.ParseUint(raw, 10, 64); err == nil {
			v := uint(n)
			byBranch = &v
		}
	}
	items, err := ctl.usecase.List(ctxUint(c, "client_id"), ctxRole(c), byClient, byBranch)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, items)
}

// Get godoc
// @Summary Get employee
// @Tags Employees
// @Produce json
// @Security BearerAuth
// @Param id path int true "Employee ID"
// @Success 200 {object} map[string]interface{}
// @Router /employees/{id} [get]
func (ctl *EmployeeController) Get(c echo.Context) error {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid employee id")
	}
	item, err := ctl.usecase.Get(id, ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		return echo.NewHTTPError(http.StatusNotFound, "employee not found")
	}
	return c.JSON(http.StatusOK, item)
}

// ListByClient godoc
// @Summary List employees by client
// @Tags Employees
// @Produce json
// @Security BearerAuth
// @Param clientId path int true "Client ID"
// @Success 200 {object} map[string]interface{}
// @Router /employees/client/{clientId} [get]
func (ctl *EmployeeController) ListByClient(c echo.Context) error {
	id, err := parseUintParam(c, "clientId")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid client id")
	}
	items, err := ctl.usecase.List(ctxUint(c, "client_id"), ctxRole(c), &id, nil)
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, items)
}

// ListByBranch godoc
// @Summary List employees by branch
// @Tags Employees
// @Produce json
// @Security BearerAuth
// @Param branchId path int true "Branch ID"
// @Success 200 {object} map[string]interface{}
// @Router /employees/branch/{branchId} [get]
func (ctl *EmployeeController) ListByBranch(c echo.Context) error {
	id, err := parseUintParam(c, "branchId")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid branch id")
	}
	items, err := ctl.usecase.List(ctxUint(c, "client_id"), ctxRole(c), nil, &id)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, items)
}

// Create godoc
// @Summary Create employee
// @Tags Employees
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param payload body map[string]interface{} true "Create employee payload"
// @Success 201 {object} map[string]interface{}
// @Router /employees [post]
func (ctl *EmployeeController) Create(c echo.Context) error {
	var input models.CreateEmployeeInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	item, err := ctl.usecase.Create(input, ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusCreated, item)
}

// Update godoc
// @Summary Update employee
// @Tags Employees
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Employee ID"
// @Param payload body map[string]interface{} true "Update employee payload"
// @Success 200 {object} map[string]interface{}
// @Router /employees/{id} [put]
func (ctl *EmployeeController) Update(c echo.Context) error {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid employee id")
	}
	var input models.UpdateEmployeeInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	item, err := ctl.usecase.Update(id, input, ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "employee not found" {
			return echo.NewHTTPError(http.StatusNotFound, "employee not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, item)
}

// Delete godoc
// @Summary Delete employee
// @Tags Employees
// @Produce json
// @Security BearerAuth
// @Param id path int true "Employee ID"
// @Success 204 {object} map[string]interface{}
// @Router /employees/{id} [delete]
func (ctl *EmployeeController) Delete(c echo.Context) error {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid employee id")
	}
	if err := ctl.usecase.Delete(id, ctxUint(c, "client_id"), ctxRole(c)); err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "employee not found" {
			return echo.NewHTTPError(http.StatusNotFound, "employee not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

// Create godoc
// @Summary Create API key
// @Tags API Keys
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param payload body map[string]interface{} true "Create API key payload"
// @Success 201 {object} map[string]interface{}
// @Router /api-keys [post]
func (ctl *ApiKeyController) Create(c echo.Context) error {
	var input models.CreateApiKeyInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	res, err := ctl.usecase.Create(input, ctxUint(c, "client_id"), ctxRole(c), ctxUint(c, "user_id"))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusCreated, map[string]any{"data": res, "message": "API key created successfully. Save this key now - it will not be shown again."})
}

// Get godoc
// @Summary Get API key
// @Tags API Keys
// @Produce json
// @Security BearerAuth
// @Param id path int true "API Key ID"
// @Success 200 {object} map[string]interface{}
// @Router /api-keys/{id} [get]
func (ctl *ApiKeyController) Get(c echo.Context) error {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid api key id")
	}
	item, err := ctl.usecase.GetByID(id, ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		return echo.NewHTTPError(http.StatusNotFound, "api key not found")
	}
	return c.JSON(http.StatusOK, map[string]any{"data": item, "message": "API key retrieved successfully"})
}

// List godoc
// @Summary List API keys
// @Tags API Keys
// @Produce json
// @Security BearerAuth
// @Param client_id query int false "Client ID"
// @Success 200 {object} map[string]interface{}
// @Router /api-keys [get]
func (ctl *ApiKeyController) List(c echo.Context) error {
	clientID := ctxUint(c, "client_id")
	if raw := c.QueryParam("client_id"); raw != "" {
		if n, err := strconv.ParseUint(raw, 10, 64); err == nil {
			clientID = uint(n)
		}
	}
	if clientID == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "Client ID is required")
	}
	items, err := ctl.usecase.ListByClient(clientID, ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "Access denied to this client")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]any{"data": items, "message": "API keys retrieved successfully"})
}

// Update godoc
// @Summary Update API key
// @Tags API Keys
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "API Key ID"
// @Param payload body map[string]interface{} true "Update API key payload"
// @Success 200 {object} map[string]interface{}
// @Router /api-keys/{id} [put]
func (ctl *ApiKeyController) Update(c echo.Context) error {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid api key id")
	}
	var input models.UpdateApiKeyInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	item, err := ctl.usecase.Update(id, input, ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "api key not found" {
			return echo.NewHTTPError(http.StatusNotFound, "api key not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]any{"data": item, "message": "API key updated successfully"})
}

// Invalidate godoc
// @Summary Invalidate API key
// @Tags API Keys
// @Produce json
// @Security BearerAuth
// @Param id path int true "API Key ID"
// @Success 200 {object} map[string]interface{}
// @Router /api-keys/{id}/invalidate [post]
func (ctl *ApiKeyController) Invalidate(c echo.Context) error {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid api key id")
	}
	if err := ctl.usecase.Invalidate(id, ctxUint(c, "client_id"), ctxRole(c)); err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "api key not found" {
			return echo.NewHTTPError(http.StatusNotFound, "api key not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]any{"message": "API key invalidated successfully"})
}

// Delete godoc
// @Summary Delete API key
// @Tags API Keys
// @Produce json
// @Security BearerAuth
// @Param id path int true "API Key ID"
// @Success 204 {object} map[string]interface{}
// @Router /api-keys/{id} [delete]
func (ctl *ApiKeyController) Delete(c echo.Context) error {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid api key id")
	}
	if err := ctl.usecase.Delete(id, ctxUint(c, "client_id"), ctxRole(c)); err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "api key not found" {
			return echo.NewHTTPError(http.StatusNotFound, "api key not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

// ListByClient godoc
// @Summary List audit logs by client
// @Tags Audit Logs
// @Produce json
// @Security BearerAuth
// @Param client_id query int false "Client ID"
// @Param page query int false "Page number"
// @Param limit query int false "Page size"
// @Success 200 {object} map[string]interface{}
// @Router /audit-logs [get]
func (ctl *AuditLogController) ListByClient(c echo.Context) error {
	clientID := ctxUint(c, "client_id")
	if raw := c.QueryParam("client_id"); raw != "" {
		if n, err := strconv.ParseUint(raw, 10, 64); err == nil {
			clientID = uint(n)
		}
	}
	if clientID == 0 {
		return echo.NewHTTPError(http.StatusBadRequest, "client id is required")
	}
	page := 1
	limit := 50
	if raw := c.QueryParam("page"); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil {
			page = n
		}
	}
	if raw := c.QueryParam("limit"); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil {
			limit = n
		}
	}
	res, err := ctl.usecase.ByClient(clientID, page, limit)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, res)
}

// ListByTable godoc
// @Summary List audit logs by table
// @Tags Audit Logs
// @Produce json
// @Security BearerAuth
// @Param tableName path string true "Table name"
// @Param record_id query int false "Record ID"
// @Success 200 {object} map[string]interface{}
// @Router /audit-logs/table/{tableName} [get]
func (ctl *AuditLogController) ListByTable(c echo.Context) error {
	table := c.Param("tableName")
	var rid *uint
	if raw := c.QueryParam("record_id"); raw != "" {
		if n, err := strconv.ParseUint(raw, 10, 64); err == nil {
			v := uint(n)
			rid = &v
		}
	}
	items, err := ctl.usecase.ByTable(table, rid)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, items)
}

// Get godoc
// @Summary Get audit log by ID
// @Tags Audit Logs
// @Produce json
// @Security BearerAuth
// @Param logId path int true "Log ID"
// @Success 200 {object} map[string]interface{}
// @Router /audit-logs/{logId} [get]
func (ctl *AuditLogController) Get(c echo.Context) error {
	id, err := parseUintParam(c, "logId")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid log id")
	}
	item, err := ctl.usecase.GetByID(id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "audit log not found")
	}
	return c.JSON(http.StatusOK, item)
}

// Summary godoc
// @Summary Get dashboard summary
// @Tags Dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /dashboard [get]
func (ctl *DashboardController) Summary(c echo.Context) error {
	return c.JSON(http.StatusOK, ctl.usecase.Summary())
}

// AssetStatus godoc
// @Summary Get dashboard asset status
// @Tags Dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /dashboard/asset-status [get]
func (ctl *DashboardController) AssetStatus(c echo.Context) error {
	return c.JSON(http.StatusOK, ctl.usecase.AssetStatus())
}

// DeviceStatus godoc
// @Summary Get dashboard device status
// @Tags Dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /dashboard/device-status [get]
func (ctl *DashboardController) DeviceStatus(c echo.Context) error {
	return c.JSON(http.StatusOK, ctl.usecase.DeviceStatus())
}

// DeviceHealth godoc
// @Summary Get dashboard device health
// @Tags Dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /dashboard/device-health [get]
func (ctl *DashboardController) DeviceHealth(c echo.Context) error {
	return c.JSON(http.StatusOK, ctl.usecase.DeviceHealth())
}

// ProblemDevices godoc
// @Summary Get problem devices
// @Tags Dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /dashboard/problem-devices [get]
func (ctl *DashboardController) ProblemDevices(c echo.Context) error {
	return c.JSON(http.StatusOK, ctl.usecase.ProblemDevices())
}

// Insights godoc
// @Summary Get dashboard insights
// @Tags Dashboard
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /dashboard/insights [get]
func (ctl *DashboardController) Insights(c echo.Context) error {
	return c.JSON(http.StatusOK, ctl.usecase.Insights())
}

// List godoc
// @Summary List reports
// @Tags Reports
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /reports [get]
func (ctl *ReportController) List(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]any{"reports": []any{"assets", "assignments", "devices"}})
}

// ExportAssets godoc
// @Summary Export assets report
// @Tags Reports
// @Produce text/plain
// @Security BearerAuth
// @Success 200 {string} string
// @Router /reports/assets/export [get]
func (ctl *ReportController) ExportAssets(c echo.Context) error {
	c.Response().Header().Set(echo.HeaderContentType, "text/csv")
	c.Response().Header().Set(echo.HeaderContentDisposition, "attachment; filename=assets-report.csv")
	return c.String(http.StatusOK, ctl.usecase.ExportAssets())
}

// ExportAssignments godoc
// @Summary Export assignments report
// @Tags Reports
// @Produce text/plain
// @Security BearerAuth
// @Success 200 {string} string
// @Router /reports/assignments/export [get]
func (ctl *ReportController) ExportAssignments(c echo.Context) error {
	c.Response().Header().Set(echo.HeaderContentType, "text/csv")
	c.Response().Header().Set(echo.HeaderContentDisposition, "attachment; filename=assignments-report.csv")
	return c.String(http.StatusOK, ctl.usecase.ExportAssignments())
}

// ExportDevices godoc
// @Summary Export devices report
// @Tags Reports
// @Produce text/plain
// @Security BearerAuth
// @Success 200 {string} string
// @Router /reports/devices/export [get]
func (ctl *ReportController) ExportDevices(c echo.Context) error {
	c.Response().Header().Set(echo.HeaderContentType, "text/csv")
	c.Response().Header().Set(echo.HeaderContentDisposition, "attachment; filename=devices-report.csv")
	return c.String(http.StatusOK, ctl.usecase.ExportDevices())
}
