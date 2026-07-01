package global

import "czwlinux.cloud/go-friday-starter/pkg/httpx"

func initHTTP() error {
	var health httpx.HealthChecker
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		health.DB = sqlDB
	}
	Engine = httpx.New(&Cfg.HTTP, Log, health)
	return nil
}
