package database

import (
	"errors"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var ErrInvalidArgs = errors.New("nil arg or invalid argument")

var typeDBDriverMapping = map[DBType]string{
	Postgres: postgresDriverName,
}

func GetConnection(arg *Args) (db *gorm.DB, err error) {
	if arg == nil || !arg.IsValid() {
		err = ErrInvalidArgs
		return
	}

	driver := typeDBDriverMapping[arg.DBType]
	if driver == "" {
		driver = postgresDriverName
	}

	urlStr := GetURLString(arg)
	switch driver {
	case postgresDriverName:
		db, err = gorm.Open(postgres.Open(urlStr), &gorm.Config{})
		if err != nil {
			return
		}
	}

	dbx, err := db.DB()
	if err != nil {
		return
	}
	dbx.SetConnMaxIdleTime(arg.ConnMaxLifetime)
	dbx.SetConnMaxLifetime(arg.ConnMaxLifetime)
	dbx.SetMaxOpenConns(arg.MaxOpenConns)
	dbx.SetMaxIdleConns(arg.MaxIdleConns)
	return
}

type RWConnection struct {
	Read  *gorm.DB
	Write *gorm.DB
}

func GetReadWriteConnection(read *Args, write *Args) (conn *RWConnection, err error) {
	if read == nil || !read.IsValid() || write == nil || !write.IsValid() {
		err = ErrInvalidArgs
		return
	}

	rConn, err := GetConnection(read)
	if err != nil {
		return
	}

	wConn, err := GetConnection(write)
	if err != nil {
		return
	}

	conn = &RWConnection{
		Read:  rConn,
		Write: wConn,
	}
	return
}
