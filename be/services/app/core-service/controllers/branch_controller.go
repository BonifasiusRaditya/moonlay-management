package controllers

import (
	"net/http"
	"strconv"

	"digisign-portal/services/app/core-service/models"
	"digisign-portal/services/app/core-service/usecases"

	"github.com/labstack/echo/v4"
)

type BranchController struct{ usecase *usecases.BranchUsecase }

func NewBranchController(uc *usecases.BranchUsecase) *BranchController {
	return &BranchController{usecase: uc}
}

// List godoc
// @Summary List branches
// @Tags Branches
// @Produce json
// @Security BearerAuth
// @Param client_id query int false "Client ID"
// @Success 200 {object} map[string]interface{}
// @Router /branches [get]
func (ctl *BranchController) List(c echo.Context) error {
	var requested *uint
	if raw := c.QueryParam("client_id"); raw != "" {
		if n, err := strconv.ParseUint(raw, 10, 64); err == nil {
			tmp := uint(n)
			requested = &tmp
		}
	}
	items, err := ctl.usecase.List(ctxUint(c, "client_id"), ctxRole(c), requested)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, items)
}

// Get godoc
// @Summary Get branch
// @Tags Branches
// @Produce json
// @Security BearerAuth
// @Param branchId path int true "Branch ID"
// @Success 200 {object} map[string]interface{}
// @Router /branches/{branchId} [get]
func (ctl *BranchController) Get(c echo.Context) error {
	id, err := parseUintParam(c, "branchId")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid branch id")
	}
	item, err := ctl.usecase.Get(id, ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		return echo.NewHTTPError(http.StatusNotFound, "branch not found")
	}
	return c.JSON(http.StatusOK, item)
}

// Create godoc
// @Summary Create branch
// @Tags Branches
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param payload body map[string]interface{} true "Create branch payload"
// @Success 201 {object} map[string]interface{}
// @Router /branches [post]
func (ctl *BranchController) Create(c echo.Context) error {
	var input models.CreateBranchInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	item, err := ctl.usecase.Create(input, ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "client not found" {
			return echo.NewHTTPError(http.StatusBadRequest, "client not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusCreated, item)
}

// Update godoc
// @Summary Update branch
// @Tags Branches
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param branchId path int true "Branch ID"
// @Param payload body map[string]interface{} true "Update branch payload"
// @Success 200 {object} map[string]interface{}
// @Router /branches/{branchId} [put]
func (ctl *BranchController) Update(c echo.Context) error {
	id, err := parseUintParam(c, "branchId")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid branch id")
	}
	var input models.UpdateBranchInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	item, err := ctl.usecase.Update(id, input, ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "branch not found" {
			return echo.NewHTTPError(http.StatusNotFound, "branch not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, item)
}

// Delete godoc
// @Summary Delete branch
// @Tags Branches
// @Produce json
// @Security BearerAuth
// @Param branchId path int true "Branch ID"
// @Success 204 {object} map[string]interface{}
// @Router /branches/{branchId} [delete]
func (ctl *BranchController) Delete(c echo.Context) error {
	id, err := parseUintParam(c, "branchId")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid branch id")
	}
	if err := ctl.usecase.Delete(id, ctxUint(c, "client_id"), ctxRole(c)); err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "branch not found" {
			return echo.NewHTTPError(http.StatusNotFound, "branch not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}
