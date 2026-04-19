package middleware

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
)

type AuthMiddleware struct {
	secret        string
	serverStarted time.Time
}

func NewAuthMiddleware(secret string) *AuthMiddleware {
	if strings.TrimSpace(secret) == "" {
		secret = "change-this-secret"
	}
	return &AuthMiddleware{
		secret:        secret,
		serverStarted: time.Now().UTC(),
	}
}

func (m *AuthMiddleware) RequireAuth() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			token, err := tokenFromRequest(c)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
			}

			claims, err := m.parseToken(token)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
			}

			c.Set("user_id", claims.UserID)
			c.Set("role", claims.Role)
			c.Set("client_id", claims.ClientID)
			return next(c)
		}
	}
}

func (m *AuthMiddleware) RequireAnyRole(roles ...string) echo.MiddlewareFunc {
	allowed := map[string]struct{}{}
	for _, role := range roles {
		allowed[strings.ToLower(strings.TrimSpace(role))] = struct{}{}
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			token, err := tokenFromRequest(c)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
			}

			claims, err := m.parseToken(token)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
			}

			if _, ok := allowed[strings.ToLower(claims.Role)]; !ok {
				return echo.NewHTTPError(http.StatusForbidden, "forbidden")
			}

			c.Set("user_id", claims.UserID)
			c.Set("role", claims.Role)
			c.Set("client_id", claims.ClientID)
			return next(c)
		}
	}
}

func tokenFromRequest(c echo.Context) (string, error) {
	if cookie, err := c.Cookie("token"); err == nil {
		cookieToken := strings.TrimSpace(cookie.Value)
		if cookieToken != "" {
			return cookieToken, nil
		}
	}

	return bearerToken(c.Request().Header.Get("Authorization"))
}

func bearerToken(authHeader string) (string, error) {
	if strings.TrimSpace(authHeader) == "" {
		return "", echo.NewHTTPError(http.StatusUnauthorized, "missing authorization header")
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", echo.NewHTTPError(http.StatusUnauthorized, "invalid authorization header")
	}
	token := strings.TrimSpace(parts[1])
	if token == "" {
		return "", echo.NewHTTPError(http.StatusUnauthorized, "invalid authorization header")
	}
	return token, nil
}

type tokenClaims struct {
	UserID   uint   `json:"user_id"`
	ClientID uint   `json:"client_id"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

func (m *AuthMiddleware) parseToken(token string) (*tokenClaims, error) {
	claims := &tokenClaims{}
	parsed, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(m.secret), nil
	})
	if err != nil || !parsed.Valid {
		return nil, errors.New("invalid token")
	}

	// Invalidate tokens issued before the current backend process started.
	// This forces a fresh login whenever the backend is restarted.
	if claims.IssuedAt == nil || claims.IssuedAt.Time.Before(m.serverStarted) {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
