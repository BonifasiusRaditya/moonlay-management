package controllers

import (
	"strconv"

	"github.com/labstack/echo/v4"
)

func ctxUint(c echo.Context, key string) uint {
	if v := c.Get(key); v != nil {
		switch x := v.(type) {
		case uint:
			return x
		case int:
			if x > 0 { return uint(x) }
		case float64:
			if x > 0 { return uint(x) }
		}
	}
	return 0
}

func ctxRole(c echo.Context) string {
	if v := c.Get("role"); v != nil {
		if s, ok := v.(string); ok { return s }
	}
	return ""
}

func parseUintParam(c echo.Context, name string) (uint, error) {
	raw := c.Param(name)
	n, err := strconv.ParseUint(raw, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(n), nil
}
