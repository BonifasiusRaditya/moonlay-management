package database

import (
	"net/url"
	"time"
)

const (
	postgresDriverName string = "pgx"
	postgresSchema     string = "postgres"
)

const (
	Postgres DBType = "postgres"

	WriteConn ConnType = "write"
	ReadConn  ConnType = "read"
)

type (
	DBType   string
	ConnType string
	Args     struct {
		Username        string
		Password        string
		Host            string
		Port            int
		Database        string
		Flavor          string
		MaxIdleConns    int
		MaxOpenConns    int
		ConnMaxLifetime time.Duration
		Location        string
		Timeout         time.Duration
		Schema          string

		ConnType ConnType
		DBType   DBType
		Values   url.Values
	}
)

func (a *Args) IsValid() bool {
	return a.Username != "" && a.Password != "" && a.Host != "" && a.Port != 0 && a.Database != "" && a.DBType != ""
}
