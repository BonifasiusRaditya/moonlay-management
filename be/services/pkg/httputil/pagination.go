package httputil

import (
	"strconv"

	"github.com/labstack/echo/v4"
)

func ParsePagination(c echo.Context, defaultPageSize int) (page int, pageSize int, offset int, limit int) {
	page = parsePositiveInt(c.QueryParam("page"), 1)
	pageSize = parsePositiveInt(c.QueryParam("pageSize"), defaultPageSize)
	if pageSize > 200 {
		pageSize = 200
	}
	if pageSize < 1 {
		pageSize = defaultPageSize
	}
	offset = (page - 1) * pageSize
	limit = pageSize
	return page, pageSize, offset, limit
}

func ParseLimit(c echo.Context, defaultLimit int) int {
	limit := parsePositiveInt(c.QueryParam("limit"), defaultLimit)
	if limit > 200 {
		limit = 200
	}
	return limit
}

func parsePositiveInt(raw string, fallback int) int {
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil || value < 1 {
		return fallback
	}
	return value
}
