package main

import (
	"digisign-portal/services/cmd/core-service/command"
	_ "digisign-portal/services/docs/core-service"
)

// @title Base Golang Core Service API
// @version 1.0
// @description API documentation for core-service.
// @BasePath /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization

func main() {
	command.Execute()
}
