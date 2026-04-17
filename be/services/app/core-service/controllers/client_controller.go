package controllers

import (
	"net/http"

	"digisign-portal/services/app/core-service/models"
	"digisign-portal/services/app/core-service/usecases"

	"github.com/labstack/echo/v4"
)

type ClientController struct{ usecase *usecases.ClientUsecase }

func NewClientController(uc *usecases.ClientUsecase) *ClientController {
	return &ClientController{usecase: uc}
}

// List godoc
// @Summary List clients
// @Tags Clients
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Router /clients [get]
func (ctl *ClientController) List(c echo.Context) error {
	items, err := ctl.usecase.List(ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusOK, items)
}

// Get godoc
// @Summary Get client
// @Tags Clients
// @Produce json
// @Security BearerAuth
// @Param clientId path int true "Client ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /clients/{clientId} [get]
func (ctl *ClientController) Get(c echo.Context) error {
	id, err := parseUintParam(c, "clientId")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid client id")
	}
	item, err := ctl.usecase.Get(id, ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		return echo.NewHTTPError(http.StatusNotFound, "client not found")
	}
	return c.JSON(http.StatusOK, item)
}

// Create godoc
// @Summary Create client
// @Tags Clients
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param payload body map[string]interface{} true "Create client payload"
// @Success 201 {object} map[string]interface{}
// @Router /clients [post]
func (ctl *ClientController) Create(c echo.Context) error {
	var input models.CreateClientInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	res, err := ctl.usecase.Create(input, ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusCreated, res)
}

// Update godoc
// @Summary Update client
// @Tags Clients
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param clientId path int true "Client ID"
// @Param payload body map[string]interface{} true "Update client payload"
// @Success 200 {object} map[string]interface{}
// @Router /clients/{clientId} [put]
func (ctl *ClientController) Update(c echo.Context) error {
	id, err := parseUintParam(c, "clientId")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid client id")
	}
	var input models.UpdateClientInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	item, err := ctl.usecase.Update(id, input, ctxUint(c, "client_id"), ctxRole(c))
	if err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "client not found" {
			return echo.NewHTTPError(http.StatusNotFound, "client not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, item)
}

// Delete godoc
// @Summary Delete client
// @Tags Clients
// @Produce json
// @Security BearerAuth
// @Param clientId path int true "Client ID"
// @Success 204 {object} map[string]interface{}
// @Router /clients/{clientId} [delete]
func (ctl *ClientController) Delete(c echo.Context) error {
	id, err := parseUintParam(c, "clientId")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid client id")
	}
	if err := ctl.usecase.Delete(id, ctxRole(c)); err != nil {
		if err.Error() == "forbidden" {
			return echo.NewHTTPError(http.StatusForbidden, "forbidden")
		}
		if err.Error() == "client not found" {
			return echo.NewHTTPError(http.StatusNotFound, "client not found")
		}
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.NoContent(http.StatusNoContent)
}
