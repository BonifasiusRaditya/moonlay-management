package notification_service

import (
	"net/http"

	"digisign-portal/services/app/notification-service/routes"
	"digisign-portal/services/pkg/config"
	customerror "digisign-portal/services/pkg/customerrors"
	"digisign-portal/services/pkg/database"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/spf13/viper"
	"gorm.io/gorm"
)

const (
	serviceName = "notification-service"
	defaultPort = "3007"
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
	viper.SetConfigFile(".env")
	if err = viper.ReadInConfig(); err != nil {
		m.cfg = config.NewConfig(defaultPort, serviceName)
	} else {
		m.cfg = config.NewConfig(defaultPort, serviceName)
	}

	readDB := m.cfg.Postgres().Read
	if readDB.Username != "" && readDB.Password != "" && readDB.URL != "" && readDB.Port != 0 && readDB.Name != "" {
		m.database.Postgres, err = database.GetConnection(readDB.ToArgs(database.Postgres, database.ReadConn, nil))
		if err != nil {
			return
		}
	}

	e := echo.New()
	configureErrorHandler(e)
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())
	e.Use(middleware.RequestID())

	m.router = e

	routes.ConfigureRouter(e, serviceName, m.database.Postgres)
	return nil
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
