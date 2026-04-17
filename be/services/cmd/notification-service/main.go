package main

import (
	"digisign-portal/services/cmd/notification-service/command"
	_ "digisign-portal/services/docs/notification-service"
)

// @title Base Golang Notification Service API
// @version 1.0
// @description API documentation for notification-service.
// @BasePath /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization

func main() {
	command.Execute()
}
