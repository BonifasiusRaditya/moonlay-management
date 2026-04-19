package controllers

import (
	"net/http"
	"os"
	"strings"
	"time"

	"digisign-portal/services/app/core-service/models"
	"digisign-portal/services/app/core-service/usecases"

	"github.com/labstack/echo/v4"
)

type AuthController struct {
	usecase *usecases.AuthUsecase
}

func NewAuthController(usecaseLayer *usecases.AuthUsecase) *AuthController {
	return &AuthController{usecase: usecaseLayer}
}

// Login godoc
// @Summary Login
// @Tags Auth
// @Accept json
// @Produce json
// @Param payload body map[string]interface{} true "Login payload"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /auth/login [post]
func (ctl *AuthController) Login(c echo.Context) error {
	var input models.LoginInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if strings.TrimSpace(input.Email) == "" || strings.TrimSpace(input.Password) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "email and password are required")
	}

	res, err := ctl.usecase.Login(input)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	// Set token as HttpOnly cookie.
	// In production use SameSite=None + Secure (cross-site HTTPS).
	// In local/dev use SameSite=Lax so cookie is accepted over HTTP localhost.
	secure := strings.ToUpper(os.Getenv("APP_ENVIRONMENT")) == "PRODUCTION"
	sameSite := http.SameSiteLaxMode
	if secure {
		sameSite = http.SameSiteNoneMode
	}
	cookie := &http.Cookie{
		Name:     "token",
		Value:    res.Token,
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
		MaxAge:   int((24 * time.Hour).Seconds()),
	}
	http.SetCookie(c.Response(), cookie)

	// Remove token from response body to avoid duplication on client side
	res.Token = ""
	return c.JSON(http.StatusOK, res)
}
func (ctl *AuthController) Logout(c echo.Context) error {
	// Clear cookie by setting MaxAge to -1
	secure := strings.ToUpper(os.Getenv("APP_ENVIRONMENT")) == "PRODUCTION"
	sameSite := http.SameSiteLaxMode
	if secure {
		sameSite = http.SameSiteNoneMode
	}
	cookie := &http.Cookie{
		Name:     "token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
		MaxAge:   -1,
	}
	http.SetCookie(c.Response(), cookie)
	return c.JSON(http.StatusOK, map[string]string{"message": "Logged out successfully"})
}

func AuthMiddleware(u *usecases.AuthUsecase) echo.MiddlewareFunc {
  return func(next echo.HandlerFunc) echo.HandlerFunc {
    return func(c echo.Context) error {
      var tokenStr string
      if cookie, err := c.Cookie("token"); err == nil && cookie.Value != "" {
        tokenStr = cookie.Value
      } else {
        tokenStr = strings.TrimPrefix(c.Request().Header.Get("Authorization"), "Bearer ")
      }
      if tokenStr == "" {
        return echo.NewHTTPError(http.StatusUnauthorized, "missing token")
      }
      claims, err := u.ParseToken(tokenStr)
      if err != nil {
        return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
      }
      c.Set("user_id", claims.UserID)
      return next(c)
    }
  }
}

// Register godoc
// @Summary Register user
// @Tags Auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param payload body map[string]interface{} true "Register payload"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /auth/register [post]
func (ctl *AuthController) Register(c echo.Context) error {
	var input models.RegisterInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if input.ClientID == 0 || strings.TrimSpace(input.Name) == "" || strings.TrimSpace(input.Email) == "" || strings.TrimSpace(input.Password) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "missing required fields")
	}

	res, err := ctl.usecase.Register(input)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "exists") || strings.Contains(strings.ToLower(err.Error()), "match") {
			return echo.NewHTTPError(http.StatusBadRequest, err.Error())
		}
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	return c.JSON(http.StatusCreated, res)
}

// Me godoc
// @Summary Get current user
// @Tags Auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Router /auth/me [get]
func (ctl *AuthController) Me(c echo.Context) error {
	userIDValue := c.Get("user_id")
	userID, ok := userIDValue.(uint)
	if !ok || userID == 0 {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid auth context")
	}

	res, err := ctl.usecase.Me(userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}
	return c.JSON(http.StatusOK, res)
}

// RefreshToken godoc
// @Summary Refresh token
// @Tags Auth
// @Accept json
// @Produce json
// @Param payload body map[string]interface{} true "Refresh token payload"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /auth/refresh-token [post]
func (ctl *AuthController) RefreshToken(c echo.Context) error {
	var input models.RefreshTokenInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if strings.TrimSpace(input.Token) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "token is required")
	}

	token, err := ctl.usecase.RefreshToken(input.Token)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]string{"token": token})
}

// ForgotPassword godoc
// @Summary Request password reset
// @Tags Auth
// @Accept json
// @Produce json
// @Param payload body map[string]interface{} true "Forgot password payload"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /auth/forgot-password [post]
func (ctl *AuthController) ForgotPassword(c echo.Context) error {
	var input models.ForgotPasswordInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if strings.TrimSpace(input.Email) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "email is required")
	}

	if err := ctl.usecase.ForgotPassword(input); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "If the email exists, a password reset link has been sent"})
}

// ResetPassword godoc
// @Summary Reset password
// @Tags Auth
// @Accept json
// @Produce json
// @Param payload body map[string]interface{} true "Reset password payload"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Router /auth/reset-password [post]
func (ctl *AuthController) ResetPassword(c echo.Context) error {
	var input models.ResetPasswordInput
	if err := c.Bind(&input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if strings.TrimSpace(input.Token) == "" || strings.TrimSpace(input.NewPassword) == "" || strings.TrimSpace(input.PasswordConfirmation) == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "missing required fields")
	}

	if err := ctl.usecase.ResetPassword(input); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Password has been reset successfully"})
}
