package cache

import (
	"context"
	"testing"
	"time"
)

// testCache 通用缓存测试函数
func testCache(t *testing.T, cache Cache) {
	ctx := context.Background()
	key := "test_key"
	value := map[string]interface{}{
		"name": "test",
		"age":  25,
	}

	// 测试Set和Get
	err := cache.Set(ctx, key, value, 5*time.Minute)
	if err != nil {
		t.Fatalf("Set failed: %v", err)
	}

	var getValue map[string]interface{}
	exists, err := cache.Get(ctx, key, &getValue)
	if err != nil {
		t.Fatalf("Get failed: %v", err)
	}
	if !exists {
		t.Fatalf("Key should exist")
	}
	// 处理JSON序列化后的类型转换问题
	if getValue["name"] != value["name"] {
		t.Fatalf("Get value mismatch for name: expected %v, got %v", value["name"], getValue["name"])
	}
	// 数字类型在JSON序列化后会变成float64
	expectedAge := float64(value["age"].(int))
	actualAge, ok := getValue["age"].(float64)
	if !ok || actualAge != expectedAge {
		t.Fatalf("Get value mismatch for age: expected %v, got %v", expectedAge, getValue["age"])
	}

	// 测试Exists
	exists, err = cache.Exists(ctx, key)
	if err != nil {
		t.Fatalf("Exists failed: %v", err)
	}
	if !exists {
		t.Fatalf("Key should exist")
	}

	// 测试Expire和TTL
	err = cache.Expire(ctx, key, 10*time.Minute)
	if err != nil {
		t.Fatalf("Expire failed: %v", err)
	}

	ttl, err := cache.TTL(ctx, key)
	if err != nil {
		t.Fatalf("TTL failed: %v", err)
	}
	if ttl < 0 {
		t.Fatalf("TTL should be positive")
	}

	// 测试Delete
	err = cache.Delete(ctx, key)
	if err != nil {
		t.Fatalf("Delete failed: %v", err)
	}

	exists, err = cache.Exists(ctx, key)
	if err != nil {
		t.Fatalf("Exists after delete failed: %v", err)
	}
	if exists {
		t.Fatalf("Key should not exist after delete")
	}

	// 测试不存在的键
	_, err = cache.Get(ctx, "non_existent_key", &getValue)
	if err != nil {
		t.Fatalf("Get non-existent key failed: %v", err)
	}

	// 测试Clear
	err = cache.Set(ctx, "key1", "value1", 5*time.Minute)
	if err != nil {
		t.Fatalf("Set key1 failed: %v", err)
	}

	err = cache.Clear(ctx)
	if err != nil {
		t.Fatalf("Clear failed: %v", err)
	}

	exists, err = cache.Exists(ctx, "key1")
	if err != nil {
		t.Fatalf("Exists after clear failed: %v", err)
	}
	if exists {
		t.Fatalf("Key should not exist after clear")
	}
}

// TestMemoryCache 测试内存缓存
func TestMemoryCache(t *testing.T) {
	config := Config{
		Type:      "memory",
		MaxMemory: 100,
	}

	cache, err := NewCache(config)
	if err != nil {
		t.Fatalf("NewMemoryCache failed: %v", err)
	}

	testCache(t, cache)

	// 测试内存缓存的过期功能
	testMemoryCacheExpiration(t, cache)
}

// testMemoryCacheExpiration 测试内存缓存的过期功能
func testMemoryCacheExpiration(t *testing.T, cache Cache) {
	ctx := context.Background()
	key := "expire_key"
	value := "expire_value"

	// 设置过期时间为1秒
	err := cache.Set(ctx, key, value, 1*time.Second)
	if err != nil {
		t.Fatalf("Set with expiration failed: %v", err)
	}

	// 立即检查，应该存在
	exists, err := cache.Exists(ctx, key)
	if err != nil {
		t.Fatalf("Exists before expiration failed: %v", err)
	}
	if !exists {
		t.Fatalf("Key should exist before expiration")
	}

	// 等待过期
	time.Sleep(1100 * time.Millisecond)

	// 再次检查，应该不存在
	exists, err = cache.Exists(ctx, key)
	if err != nil {
		t.Fatalf("Exists after expiration failed: %v", err)
	}
	if exists {
		t.Fatalf("Key should not exist after expiration")
	}
}

// TestNewCache 测试创建缓存实例
func TestNewCache(t *testing.T) {
	// 测试不支持的缓存类型
	config := Config{
		Type: "invalid",
	}

	_, err := NewCache(config)
	if err != ErrUnsupportedCacheType {
		t.Fatalf("Expected ErrUnsupportedCacheType, got %v", err)
	}
}

// TestRedisCache 测试Redis缓存（可选，需要本地有Redis服务）
func TestRedisCache(t *testing.T) {
	// 跳过测试，除非环境中有Redis服务
	t.Skip("Skipping Redis cache test, requires Redis server")

	config := Config{
		Type:          "redis",
		RedisAddr:     "localhost:6379",
		RedisPassword: "",
		RedisDB:       0,
	}

	cache, err := NewCache(config)
	if err != nil {
		t.Fatalf("NewRedisCache failed: %v", err)
	}

	defer func() {
		if redisCache, ok := cache.(*RedisCache); ok {
			redisCache.Close()
		}
	}()

	testCache(t, cache)
}
