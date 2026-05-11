package controllers

import (
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"digisign-portal/services/app/core-service/models"
	"digisign-portal/services/app/core-service/usecases"

	"github.com/labstack/echo/v4"
)

type FinanceController struct{ usecase *usecases.FinanceUsecase }

func NewFinanceController(uc *usecases.FinanceUsecase) *FinanceController {
	return &FinanceController{usecase: uc}
}

// ImportDocument godoc
// @Summary Upload finance document
// @Tags Finance
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "Finance document"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 502 {object} map[string]interface{}
// @Router /finance/import-document [post]
func (ctl *FinanceController) ImportDocument(c echo.Context) error {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "file is required")
	}

	// Validate file extension
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if ext != ".pdf" && ext != ".csv" && ext != ".xlsx" {
		return echo.NewHTTPError(http.StatusBadRequest, "only PDF, CSV, and XLSX files are allowed")
	}

	src, err := fileHeader.Open()
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to open uploaded file")
	}
	defer src.Close()

	content, err := io.ReadAll(src)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to read uploaded file")
	}

	status, upstreamBody, err := ctl.usecase.ImportDocument(fileHeader.Filename, content)
	if err != nil {
		if status == 0 {
			return echo.NewHTTPError(http.StatusBadGateway, err.Error())
		}
		return echo.NewHTTPError(http.StatusBadGateway, upstreamBody)
	}

	return c.JSON(http.StatusOK, models.FinanceImportResponse{
		Message:        "Dokumen berhasil diteruskan ke n8n",
		Filename:       fileHeader.Filename,
		UpstreamStatus: status,
		UpstreamBody:   upstreamBody,
	})
}
