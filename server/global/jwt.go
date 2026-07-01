package global

import (
	"strings"

	jwtpkg "czwlinux.cloud/go-friday-starter/pkg/jwt"
	"go.uber.org/zap"
)

func initJWT() error {
	if strings.TrimSpace(Cfg.JWT.Secret) == jwtpkg.DefaultSecret {
		Log.Warn("jwt secret uses default placeholder; change it before production", zap.String("secret", jwtpkg.DefaultSecret))
	}

	manager, err := jwtpkg.New(Cfg.JWT)
	if err != nil {
		return err
	}
	JWT = manager
	return nil
}
