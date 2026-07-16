package driver

import (
	"fmt"

	"github.com/redis/go-redis/v9"
)

// RedisOptions 从 ConnConfig 构建 go-redis 选项。
func RedisOptions(cfg ConnConfig) *redis.Options {
	db := 0
	if cfg.Database != "" {
		fmt.Sscanf(cfg.Database, "%d", &db)
	}
	return &redis.Options{
		Addr:         fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Username:     cfg.Username,
		Password:     cfg.Password,
		DB:           db,
		PoolSize:     5,
		MinIdleConns: 1,
	}
}
