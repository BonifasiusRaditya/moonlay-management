package httputil

import "github.com/labstack/echo/v4"

func ActorID(c echo.Context) string {
	if raw := c.Get("sub"); raw != nil {
		if sub, ok := raw.(string); ok && sub != "" {
			return sub
		}
	}
	return "anonymous"
}
