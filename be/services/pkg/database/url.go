package database

import (
	"fmt"
	"net/url"
	"strconv"
)

var typeDBSchemaMapping = map[DBType]string{
	Postgres: postgresSchema,
}

func GetURL(arg *Args) (res *url.URL) {
	if arg == nil || !arg.IsValid() {
		return nil
	}

	scheme := typeDBSchemaMapping[arg.DBType]
	if scheme == "" {
		scheme = postgresSchema
	}

	res = &url.URL{
		Scheme: scheme,
		User:   url.UserPassword(arg.Username, arg.Password),
		Path:   arg.Database,
		Host:   fmt.Sprintf("%s:%d", arg.Host, arg.Port),
	}

	query := res.Query()
	if arg.Schema != "" {
		query.Set("search_path", arg.Schema)
	}

	isURLValNil := arg.Values == nil
	if arg.Values == nil {
		arg.Values = make(url.Values)
	}

	switch scheme {
	case postgresSchema:
		if isURLValNil {
			arg.Values.Add("sslmode", "disable")
			arg.Values.Add("extra_float_digits", "-1")
		}

		timeout := uint64(arg.Timeout.Seconds())
		arg.Values.Add("connect_timeout", strconv.FormatUint(timeout, 10))
	}

	for key, values := range arg.Values {
		for _, value := range values {
			query.Add(key, value)
		}
	}

	res.RawQuery = query.Encode()
	return
}

func GetURLString(arg *Args) (res string) {
	url := GetURL(arg)
	if url == nil {
		return
	}

	res = url.String()
	return
}
