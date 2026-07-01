package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisCache Redis缓存实现
type RedisCache struct {
	client *redis.Client
	ctx    context.Context
}

// NewRedisCache 创建Redis缓存实例
func NewRedisCache(config Config) (*RedisCache, error) {
	// 创建Redis客户端
	client := redis.NewClient(&redis.Options{
		Addr:     config.RedisAddr,
		Password: config.RedisPassword,
		DB:       config.RedisDB,
	})

	// 测试连接
	ctx := context.Background()
	_, err := client.Ping(ctx).Result()
	if err != nil {
		return nil, ErrConnectionFailed
	}

	return &RedisCache{
		client: client,
		ctx:    ctx,
	}, nil
}

// Set 设置缓存
func (c *RedisCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	// 序列化值
	data, err := json.Marshal(value)
	if err != nil {
		return ErrSerialization
	}

	// 使用Redis的Set命令
	err = c.client.Set(ctx, key, data, expiration).Err()
	if err != nil {
		return err
	}

	return nil
}

// Get 获取缓存
func (c *RedisCache) Get(ctx context.Context, key string, value interface{}) (bool, error) {
	// 使用Redis的Get命令
	data, err := c.client.Get(ctx, key).Bytes()
	if err != nil {
		if err == redis.Nil {
			// 键不存在
			return false, nil
		}
		return false, err
	}

	// 反序列化值
	err = json.Unmarshal(data, value)
	if err != nil {
		return false, ErrDeserialization
	}

	return true, nil
}

// Delete 删除缓存
func (c *RedisCache) Delete(ctx context.Context, key string) error {
	// 使用Redis的Del命令
	return c.client.Del(ctx, key).Err()
}

// Exists 检查缓存是否存在
func (c *RedisCache) Exists(ctx context.Context, key string) (bool, error) {
	// 使用Redis的Exists命令
	result, err := c.client.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return result > 0, nil
}

// Expire 设置缓存过期时间
func (c *RedisCache) Expire(ctx context.Context, key string, expiration time.Duration) error {
	// 使用Redis的Expire命令
	result, err := c.client.Expire(ctx, key, expiration).Result()
	if err != nil {
		return err
	}
	if !result {
		return ErrKeyNotFound
	}
	return nil
}

// TTL 获取缓存剩余生存时间
func (c *RedisCache) TTL(ctx context.Context, key string) (time.Duration, error) {
	// 使用Redis的TTL命令
	ttl, err := c.client.TTL(ctx, key).Result()
	if err != nil {
		return -1, err
	}
	if ttl == -2 {
		// 键不存在
		return -1, ErrKeyNotFound
	}
	return ttl, nil
}

// Clear 清空所有缓存
func (c *RedisCache) Clear(ctx context.Context) error {
	// 使用Redis的FlushDB命令，仅清空当前数据库
	return c.client.FlushDB(ctx).Err()
}

// Close 关闭Redis连接
func (c *RedisCache) Close() error {
	return c.client.Close()
}
