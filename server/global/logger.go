package global

import "czwlinux.cloud/go-friday-starter/pkg/logger"

func initLogger() error {
	log, err := logger.NewLogger(&Cfg.Log)
	if err != nil {
		return err
	}
	Log = log
	return nil
}
