package global

import (
	"context"
	"fmt"
	"net"
	"strconv"

	"czwlinux.cloud/go-friday-starter/config"
	"czwlinux.cloud/go-friday-starter/pkg/database"
	"czwlinux.cloud/go-friday-starter/pkg/jwt"
	"czwlinux.cloud/go-friday-starter/pkg/logger"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

var (
	Cfg    *config.AppConfig
	Log    *logger.Logger
	DB     *gorm.DB
	Engine *echo.Echo
	JWT    *jwt.Manager
)

// Init 一行初始化项目基础设施：配置、日志、数据库、JWT、Echo。
// 业务代码可直接使用 global.Cfg / global.Log / global.DB / global.JWT / global.Engine。
func Init(configFile string) error {
	Cfg = config.Load(configFile)

	if err := initLogger(); err != nil {
		return err
	}
	if err := initDatabase(); err != nil {
		return err
	}
	if err := initJWT(); err != nil {
		return err
	}
	if err := initHTTP(); err != nil {
		return err
	}

	return nil
}

func MustInit(configFile string) {
	if err := Init(configFile); err != nil {
		panic(fmt.Sprintf("init global: %v", err))
	}
}

func Shutdown(ctx context.Context) error {
	if Engine != nil {
		if err := Engine.Shutdown(ctx); err != nil {
			return err
		}
	}
	if DB != nil {
		database.Shutdown(DB)
	}
	if Log != nil {
		_ = Log.Sync()
	}
	return nil
}

func Addr() string {
	if Cfg == nil {
		return ":8080"
	}
	return net.JoinHostPort(Cfg.HTTP.Host, strconv.Itoa(Cfg.HTTP.Port))
}
