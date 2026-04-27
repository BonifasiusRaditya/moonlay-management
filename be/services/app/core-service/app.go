package core_service

import (
	"errors"
	"net/http"
	"os"

	"digisign-portal/services/app/core-service/routes"
	"digisign-portal/services/pkg/config"
	customerror "digisign-portal/services/pkg/customerrors"
	"digisign-portal/services/pkg/database"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/spf13/viper"
	"gorm.io/gorm"
)

const (
	serviceName = "core-service"
	defaultPort = "3000"
)

type Main struct {
	cfg      *config.Config
	database Database
	router   *echo.Echo
}

type Database struct {
	Postgres *gorm.DB
}

func New() *Main {
	return new(Main)
}

func (m *Main) Init() (err error) {
	loadEnvFile([]string{".env", "../.env"})
	viper.AutomaticEnv()
	m.cfg = config.NewConfig(defaultPort, serviceName)

	readDB := m.cfg.Postgres().Read
	if !hasCompleteReadDBConfig(readDB) {
		return errors.New("database configuration is incomplete: set DB_POSTGRES_USER, DB_POSTGRES_PASSWORD, DB_POSTGRES_HOST, DB_POSTGRES_PORT, and DB_POSTGRES_NAME")
	}

	m.database.Postgres, err = database.GetConnection(readDB.ToArgs(database.Postgres, database.ReadConn, nil))
	if err != nil {
		return
	}

	e := echo.New()
	configureErrorHandler(e)
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:5173"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}))
	e.Use(middleware.RequestID())

	m.router = e
	routes.ConfigureRouter(e, serviceName, m.database.Postgres)
	return nil
}

func loadEnvFile(candidates []string) {
	for _, file := range candidates {
		if _, statErr := os.Stat(file); statErr != nil {
			continue
		}
		viper.SetConfigFile(file)
		if err := viper.ReadInConfig(); err == nil {
			return
		}
	}
}

func hasCompleteReadDBConfig(dbCfg config.Database) bool {
	return dbCfg.Username != "" && dbCfg.Password != "" && dbCfg.URL != "" && dbCfg.Port != 0 && dbCfg.Name != ""
}

func configureErrorHandler(e *echo.Echo) {
	e.HTTPErrorHandler = func(err error, c echo.Context) {
		if c.Response().Committed {
			return
		}

		status := http.StatusInternalServerError
		message := http.StatusText(status)

		if httpErr, ok := err.(*echo.HTTPError); ok {
			status = httpErr.Code
			switch msg := httpErr.Message.(type) {
			case string:
				message = msg
			case error:
				message = msg.Error()
			default:
				message = http.StatusText(status)
			}
		} else {
			status = customerror.GetStatusCode(err)
			message = err.Error()
		}

		requestID := c.Response().Header().Get(echo.HeaderXRequestID)
		if requestID == "" {
			requestID = c.Request().Header.Get(echo.HeaderXRequestID)
		}

		_ = c.JSON(status, map[string]any{
			"code":       status,
			"message":    message,
			"request_id": requestID,
		})
	}
}

func (m *Main) Run() (err error) {
	defer m.close()
	m.router.Start(":" + m.cfg.ServicePort)
	return
}

func (m *Main) close() {
	if m.database.Postgres != nil {
		if db, err := m.database.Postgres.DB(); err == nil {
			db.Close()
		}
	}
}
