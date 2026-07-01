package cache

import (
	"context"
	"time"
)

// Cache 缓存接口，定义了所有缓存实现必须支持的方法
type Cache interface {
	// Set 设置缓存，带过期时间
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	// Get 获取缓存，返回原值和是否存在
	Get(ctx context.Context, key string, value interface{}) (bool, error)
	// Delete 删除缓存
	Delete(ctx context.Context, key string) error
	// Exists 检查缓存是否存在
	Exists(ctx context.Context, key string) (bool, error)
	// Expire 设置缓存过期时间
	Expire(ctx context.Context, key string, expiration time.Duration) error
	// TTL 获取缓存剩余生存时间
	TTL(ctx context.Context, key string) (time.Duration, error)
	// Clear 清空所有缓存
	Clear(ctx context.Context) error
}

// Config 缓存配置
type Config struct {
	// Type 缓存类型: memory, redis
	Type string
	// RedisAddr Redis地址，仅Redis类型有效
	RedisAddr string
	// RedisPassword Redis密码，仅Redis类型有效
	RedisPassword string
	// RedisDB Redis数据库索引，仅Redis类型有效
	RedisDB int
	// MaxMemory 最大内存使用量，仅内存类型有效（单位：MB）
	MaxMemory int
}

// NewCache 创建缓存实例
func NewCache(config Config) (Cache, error) {
	switch config.Type {
	case "memory":
		return NewMemoryCache(config)
	case "redis":
		return NewRedisCache(config)
	default:
		return nil, ErrUnsupportedCacheType
	}
}
