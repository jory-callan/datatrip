package global

import "czwlinux.cloud/go-friday-starter/pkg/database"

func initDatabase() error {
	db, err := database.New(Cfg.Database, Log)
	if err != nil {
		return err
	}
	DB = db
	return nil
}
