package controllers

import (
	"net/http"

	"digisign-portal/services/app/core-service/models"
	"digisign-portal/services/app/core-service/usecases"

	"github.com/labstack/echo/v4"
)

type UserController struct{ usecase *usecases.UserUsecase }

func NewUserController(uc *usecases.UserUsecase) *UserController { return &UserController{usecase: uc} }

// List godoc
// @Summary List users
// @Tags Users
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /users [get]
func (ctl *UserController) List(c echo.Context) error {
	items, err := ctl.usecase.List(ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, items)
}

// Get godoc
// @Summary Get user
// @Tags Users
// @Produce json
// @Security BearerAuth
// @Param id path int true "User ID"
// @Success 200 {object} map[string]interface{}
// @Router /users/{id} [get]
func (ctl *UserController) Get(c echo.Context) error {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user id")
	}
	item, err := ctl.usecase.Get(id, ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		return echo.NewHTTPError(http.StatusNotFound, "user not found")
	}
	return c.JSON(http.StatusOK, item)
}

// Create godoc
// @Summary Create user
// @Tags Users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param payload body map[string]interface{} true "Create user payload"
// @Success 201 {object} map[string]interface{}
// @Router /users [post]
func (ctl *UserController) Create(c echo.Context) error {
	var input models.CreateUserInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	res, err := ctl.usecase.Create(input, ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusCreated, res)
}

// Update godoc
// @Summary Update user
// @Tags Users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "User ID"
// @Param payload body map[string]interface{} true "Update user payload"
// @Success 200 {object} map[string]interface{}
// @Router /users/{id} [put]
func (ctl *UserController) Update(c echo.Context) error {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user id")
	}
	var input models.UpdateUserInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	item, err := ctl.usecase.Update(id, input, ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "user not found" {
			return echo.NewHTTPError(http.StatusNotFound, "user not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, item)
}

// ChangePassword godoc
// @Summary Change user password
// @Tags Users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "User ID"
// @Param payload body map[string]interface{} true "Change password payload"
// @Success 200 {object} map[string]interface{}
// @Router /users/{id}/password [put]
func (ctl *UserController) ChangePassword(c echo.Context) error {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user id")
	}
	var input models.ChangePasswordInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if err := ctl.usecase.ChangePassword(id, ctxUint(c, "user_id"), ctxRole(c), input); err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "user not found" {
			return echo.NewHTTPError(http.StatusNotFound, "user not found")
		}
		if err.Error() == "current password is incorrect" {
			return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Password has been changed successfully"})
}

// Delete godoc
// @Summary Delete user
// @Tags Users
// @Produce json
// @Security BearerAuth
// @Param id path int true "User ID"
// @Success 204 {object} map[string]interface{}
// @Router /users/{id} [delete]
func (ctl *UserController) Delete(c echo.Context) error {
	id, err := parseUintParam(c, "id")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid user id")
	}
	if err := ctl.usecase.Delete(id, ctxUint(c, "client_id"), ctxRole(c)); err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "user not found" {
			return echo.NewHTTPError(http.StatusNotFound, "user not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}
