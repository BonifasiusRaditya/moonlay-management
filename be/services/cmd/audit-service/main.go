package main

import (
	"digisign-portal/services/cmd/audit-service/command"
	_ "digisign-portal/services/docs/audit-service"
)

// @title Base Golang Audit Service API
// @version 1.0
// @description API documentation for audit-service.
// @BasePath /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization

func main() {
	command.Execute()
}
