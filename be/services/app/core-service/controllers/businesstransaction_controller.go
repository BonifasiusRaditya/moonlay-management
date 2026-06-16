package controllers

import (
	"errors"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"strings"

	"digisign-portal/services/app/core-service/models"
	"digisign-portal/services/app/core-service/usecases"

	"github.com/labstack/echo/v4"
)

type BusinessController struct{ usecase *usecases.BusinessUsecase }

func NewBusinessController(uc *usecases.BusinessUsecase) *BusinessController {
	return &BusinessController{usecase: uc}
}

// GetTransactionDetail godoc
// @Summary Get business transaction detail
// @Tags Business
// @Produce json
// @Security BearerAuth
// @Param id path string true "Transaction ID"
// @Success 200 {object} models.BusinessTransactionDetail
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /business/transactions/{id} [get]
func (ctl *BusinessController) GetTransactionDetail(c echo.Context) error {
	transactionID := strings.TrimSpace(c.Param("id"))
	if transactionID == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "transaction id is required")
	}

	detail, err := ctl.usecase.GetBusinessTransactionDetail(c.Request().Context(), transactionID)
	if err != nil {
		if errors.Is(err, usecases.ErrBusinessTransactionNotFound) {
			return echo.NewHTTPError(http.StatusNotFound, "business transaction not found")
		}
		log.Printf("business.get-transaction-detail: failed id=%s err=%v", transactionID, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to load business transaction detail")
	}

	return c.JSON(http.StatusOK, detail)
}

// ListTransactions godoc
// @Summary List business transactions
// @Tags Business
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.BusinessTransactionListItem
// @Failure 500 {object} map[string]interface{}
// @Router /business/transactions [get]
func (ctl *BusinessController) ListTransactions(c echo.Context) error {
	items, err := ctl.usecase.ListBusinessTransactions(c.Request().Context())
	if err != nil {
		log.Printf("business.list-transactions: failed err=%v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to load business transactions")
	}

	return c.JSON(http.StatusOK, items)
}

// ImportDocument godoc
// @Summary Upload business document
// @Tags Business
// @Accept multipart/form-data
// @Produce json
// @Security BearerAuth
// @Param file formData file true "Business document"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 502 {object} map[string]interface{}
// @Router /business/import-document [post]
func (ctl *BusinessController) ImportDocument(c echo.Context) error {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "file is required")
	}

	// Validate file extension
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if ext != ".pdf" && ext != ".csv" && ext != ".xls" && ext != ".xlsx" {
		log.Printf("business.import-document: invalid extension file=%s ext=%s", fileHeader.Filename, ext)
		return echo.NewHTTPError(http.StatusBadRequest, "only PDF, CSV, and XLSX files are allowed")
	}

	src, err := fileHeader.Open()
	if err != nil {
		log.Printf("business.import-document: failed to open file=%s err=%v", fileHeader.Filename, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to open uploaded file")
	}
	defer src.Close()

	content, err := io.ReadAll(src)
	if err != nil {
		log.Printf("business.import-document: failed to read file=%s err=%v", fileHeader.Filename, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to read uploaded file")
	}
	log.Printf("business.import-document: sending file=%s bytes=%d to n8n", fileHeader.Filename, len(content))

	// Get uploader id from auth middleware (if available)
	var uploaderID uint
	if v := c.Get("user_id"); v != nil {
		log.Printf("business.import-document: user_id from context type=%T value=%v", v, v)
		if id, ok := v.(uint); ok {
			uploaderID = id
			log.Printf("business.import-document: uploaderID set to %d", uploaderID)
		} else if id64, ok := v.(float64); ok {
			uploaderID = uint(id64)
			log.Printf("business.import-document: uploaderID converted from float64 to %d", uploaderID)
		} else {
			log.Printf("business.import-document: failed to assert user_id as uint, using 0")
		}
	}
	log.Printf("business.import-document: final uploaderID=%d file=%s", uploaderID, fileHeader.Filename)

	status, upstreamBody, savedCount, aiSavedCount, err := ctl.usecase.ImportDocument(c.Request().Context(), fileHeader.Filename, content, uploaderID)
	if err != nil {
		log.Printf("business.import-document: failed file=%s upstream_status=%d saved_count=%d ai_saved_count=%d err=%v body=%s", fileHeader.Filename, status, savedCount, aiSavedCount, err, upstreamBody)
		if status == 0 {
			return echo.NewHTTPError(http.StatusBadGateway, err.Error())
		}
		return echo.NewHTTPError(http.StatusBadGateway, upstreamBody)
	}

	msg := "Dokumen berhasil di upload dan disimpan"
	if aiSavedCount > 0 {
		msg = "Dokumen berhasil di upload, disimpan, dan diproses AI confidence"
	}
	log.Printf("business.import-document: success file=%s upstream_status=%d saved_count=%d ai_saved_count=%d", fileHeader.Filename, status, savedCount, aiSavedCount)
	return c.JSON(http.StatusOK, models.FinanceImportResponse{
		Message:                msg,
		Filename:               fileHeader.Filename,
		UpstreamStatus:         status,
		UpstreamBody:           upstreamBody,
		SavedCount:             savedCount,
		AIConfidenceSavedCount: aiSavedCount,
	})
}
