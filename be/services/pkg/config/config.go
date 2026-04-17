package config

import (
	"digisign-portal/services/pkg/database"
	"net/url"

	"github.com/spf13/viper"
)

type Config struct {
	ServiceName        string           `mapstructure:"service_name" json:"service_name"`
	ServiceHost        string           `mapstructure:"service_host" json:"service_host"`
	ServiceEndpointV   string           `mapstructure:"service_endpoint_v" json:"service_endpoint_v"`
	ServiceEnvironment string           `mapstructure:"service_environment" json:"service_environment"`
	ServicePort        string           `mapstructure:"service_port" json:"service_port"`
	Database           DatabasePlatform `mapstructure:"database" json:"database"`
}

func NewConfig(defaultPort string, serviceName string) *Config {
	cfg := &Config{
		ServiceName:        serviceName,
		ServiceHost:        viper.GetString("APP_HOST"),
		ServiceEndpointV:   viper.GetString("APP_ENDPOINT_V"),
		ServiceEnvironment: viper.GetString("APP_ENVIRONMENT"),
		ServicePort:        viper.GetString("APP_PORT"),
		Database:           LoadDatabaseConfig(),
	}

	if cfg.ServiceHost == "" {
		cfg.ServiceHost = "localhost"
	}
	if cfg.ServiceEndpointV == "" {
		cfg.ServiceEndpointV = "v1"
	}
	if cfg.ServiceEnvironment == "" {
		cfg.ServiceEnvironment = "DEVELOPMENT"
	}
	if cfg.ServicePort == "" {
		cfg.ServicePort = defaultPort
	}
	if cfg.ServiceName == "" {
		cfg.ServiceName = serviceName
	}

	return cfg
}

func (d *Database) ToArgs(dbType database.DBType, connType database.ConnType, val url.Values) (res *database.Args) {
	res = &database.Args{
		Username:        d.Username,
		Password:        d.Password,
		Host:            d.URL,
		Port:            d.Port,
		Database:        d.Name,
		MaxIdleConns:    d.MaxIdleConns,
		MaxOpenConns:    d.MaxOpenConns,
		ConnMaxLifetime: d.MaxLifetime,
		Flavor:          d.Flavor,
		Location:        d.Location,
		Timeout:         d.Timeout,
		Schema:          d.Schema,

		DBType:   dbType,
		ConnType: connType,
		Values:   val,
	}
	return
}
