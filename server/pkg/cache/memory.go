package cache

import (
	"context"
	"encoding/json"
	"sync"
	"time"
)

// memoryItem 内存缓存项
type memoryItem struct {
	Value      []byte    // 序列化后的值
	Expiration time.Time // 过期时间
}

// isExpired 检查是否过期
func (item *memoryItem) isExpired() bool {
	if item.Expiration.IsZero() {
		return false
	}
	return time.Now().After(item.Expiration)
}

// MemoryCache 内存缓存实现
type MemoryCache struct {
	items sync.Map // key -> *memoryItem
}

// NewMemoryCache 创建内存缓存实例
func NewMemoryCache(config Config) (*MemoryCache, error) {
	cache := &MemoryCache{}
	// 启动清理过期项的goroutine
	go cache.cleanupRoutine()
	return cache, nil
}

// cleanupRoutine 定期清理过期项
func (c *MemoryCache) cleanupRoutine() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		c.clearExpired()
	}
}

// clearExpired 清理过期的缓存项
func (c *MemoryCache) clearExpired() {
	c.items.Range(func(key, value interface{}) bool {
		item := value.(*memoryItem)
		if item.isExpired() {
			c.items.Delete(key)
		}
		return true
	})
}

// Set 设置缓存
func (c *MemoryCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	// 序列化值
	data, err := json.Marshal(value)
	if err != nil {
		return ErrSerialization
	}

	// 计算过期时间
	var exp time.Time
	if expiration > 0 {
		exp = time.Now().Add(expiration)
	}

	// 存储缓存项
	c.items.Store(key, &memoryItem{
		Value:      data,
		Expiration: exp,
	})

	return nil
}

// Get 获取缓存
func (c *MemoryCache) Get(ctx context.Context, key string, value interface{}) (bool, error) {
	itemValue, found := c.items.Load(key)
	if !found {
		return false, nil
	}

	item := itemValue.(*memoryItem)
	// 检查是否过期
	if item.isExpired() {
		// 惰性删除
		c.items.Delete(key)
		return false, nil
	}

	// 反序列化值
	err := json.Unmarshal(item.Value, value)
	if err != nil {
		return false, ErrDeserialization
	}

	return true, nil
}

// Delete 删除缓存
func (c *MemoryCache) Delete(ctx context.Context, key string) error {
	c.items.Delete(key)
	return nil
}

// Exists 检查缓存是否存在
func (c *MemoryCache) Exists(ctx context.Context, key string) (bool, error) {
	itemValue, found := c.items.Load(key)
	if !found {
		return false, nil
	}

	item := itemValue.(*memoryItem)
	// 检查是否过期
	if item.isExpired() {
		// 惰性删除
		c.items.Delete(key)
		return false, nil
	}

	return true, nil
}

// Expire 设置缓存过期时间
func (c *MemoryCache) Expire(ctx context.Context, key string, expiration time.Duration) error {
	itemValue, found := c.items.Load(key)
	if !found {
		return ErrKeyNotFound
	}

	item := itemValue.(*memoryItem)
	// 检查是否过期
	if item.isExpired() {
		c.items.Delete(key)
		return ErrKeyNotFound
	}

	// 设置新的过期时间
	var exp time.Time
	if expiration > 0 {
		exp = time.Now().Add(expiration)
	}
	item.Expiration = exp

	// 重新存储
	c.items.Store(key, item)

	return nil
}

// TTL 获取缓存剩余生存时间
func (c *MemoryCache) TTL(ctx context.Context, key string) (time.Duration, error) {
	itemValue, found := c.items.Load(key)
	if !found {
		return -1, ErrKeyNotFound
	}

	item := itemValue.(*memoryItem)
	// 检查是否过期
	if item.isExpired() {
		c.items.Delete(key)
		return -1, ErrKeyNotFound
	}

	// 如果没有设置过期时间，返回0
	if item.Expiration.IsZero() {
		return 0, nil
	}

	return time.Until(item.Expiration), nil
}

// Clear 清空所有缓存
func (c *MemoryCache) Clear(ctx context.Context) error {
	c.items = sync.Map{}
	return nil
}
