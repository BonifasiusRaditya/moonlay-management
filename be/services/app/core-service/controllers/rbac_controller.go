package controllers

import (
	"net/http"
	"strconv"

	"digisign-portal/services/app/core-service/models"
	"digisign-portal/services/app/core-service/usecases"

	"github.com/labstack/echo/v4"
)

type RBACController struct{ usecase *usecases.RBACUsecase }

func NewRBACController(uc *usecases.RBACUsecase) *RBACController { return &RBACController{usecase: uc} }

// ListPermissions godoc
// @Summary List permissions
// @Tags RBAC
// @Produce json
// @Security BearerAuth
// @Param include_hidden query bool false "Include hidden permissions"
// @Success 200 {object} map[string]interface{}
// @Router /rbac/permissions [get]
func (ctl *RBACController) ListPermissions(c echo.Context) error {
	includeHidden := c.QueryParam("include_hidden") == "true"
	items, err := ctl.usecase.ListPermissions(includeHidden)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, items)
}

// ListRoles godoc
// @Summary List roles
// @Tags RBAC
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /rbac/roles [get]
func (ctl *RBACController) ListRoles(c echo.Context) error {
	items, err := ctl.usecase.ListRoles(ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, items)
}

// CreateRole godoc
// @Summary Create role
// @Tags RBAC
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param payload body map[string]interface{} true "Create role payload"
// @Success 201 {object} map[string]interface{}
// @Router /rbac/roles [post]
func (ctl *RBACController) CreateRole(c echo.Context) error {
	var input models.CreateRoleInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	item, err := ctl.usecase.CreateRole(input, ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusCreated, item)
}

// UpdateRole godoc
// @Summary Update role
// @Tags RBAC
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param roleId path int true "Role ID"
// @Param payload body map[string]interface{} true "Update role payload"
// @Success 200 {object} map[string]interface{}
// @Router /rbac/roles/{roleId} [put]
func (ctl *RBACController) UpdateRole(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("roleId"), 10, 64)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid role id")
	}
	var input models.UpdateRoleInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	item, err := ctl.usecase.UpdateRole(uint(id), input, ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "role not found" {
			return echo.NewHTTPError(http.StatusNotFound, "role not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, item)
}

// DeleteRole godoc
// @Summary Delete role
// @Tags RBAC
// @Produce json
// @Security BearerAuth
// @Param roleId path int true "Role ID"
// @Success 204 {object} map[string]interface{}
// @Router /rbac/roles/{roleId} [delete]
func (ctl *RBACController) DeleteRole(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("roleId"), 10, 64)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid role id")
	}
	if err := ctl.usecase.DeleteRole(uint(id), ctxUint(c, "client_id"), ctxRole(c)); err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "role not found" {
			return echo.NewHTTPError(http.StatusNotFound, "role not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}

// GetRolePermissions godoc
// @Summary Get role permissions
// @Tags RBAC
// @Produce json
// @Security BearerAuth
// @Param roleId path int true "Role ID"
// @Success 200 {object} map[string]interface{}
// @Router /rbac/roles/{roleId}/permissions [get]
func (ctl *RBACController) GetRolePermissions(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("roleId"), 10, 64)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid role id")
	}
	items, err := ctl.usecase.GetRolePermissions(uint(id), ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "role not found" {
			return echo.NewHTTPError(http.StatusNotFound, "role not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, items)
}

// SetRolePermissions godoc
// @Summary Set role permissions
// @Tags RBAC
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param roleId path int true "Role ID"
// @Param payload body map[string]interface{} true "Set role permissions payload"
// @Success 200 {object} map[string]interface{}
// @Router /rbac/roles/{roleId}/permissions [put]
func (ctl *RBACController) SetRolePermissions(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("roleId"), 10, 64)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid role id")
	}
	var input models.SetRolePermissionsInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if err := ctl.usecase.SetRolePermissions(uint(id), input.Permissions, ctxUint(c, "client_id"), ctxRole(c)); err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "role not found" {
			return echo.NewHTTPError(http.StatusNotFound, "role not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]any{"ok": true})
}

// AssignUserRole godoc
// @Summary Assign user role
// @Tags RBAC
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param userId path int true "User ID"
// @Param payload body map[string]interface{} true "Assign role payload"
// @Success 200 {object} map[string]interface{}
// @Router /rbac/users/{userId}/role [put]
func (ctl *RBACController) AssignUserRole(c echo.Context) error {
	uid, err := strconv.ParseUint(c.Param("userId"), 10, 64)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user id")
	}
	var input models.AssignRoleInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if err := ctl.usecase.AssignRoleToUser(uint(uid), input.Role, ctxUint(c, "client_id"), ctxRole(c)); err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "user not found" {
			return echo.NewHTTPError(http.StatusNotFound, "user not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]any{"ok": true})
}
