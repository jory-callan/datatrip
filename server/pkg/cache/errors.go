package cache

import "errors"

// 定义缓存相关的错误
var (
	// ErrUnsupportedCacheType 不支持的缓存类型
	ErrUnsupportedCacheType = errors.New("unsupported cache type")
	// ErrKeyNotFound 键不存在
	ErrKeyNotFound = errors.New("key not found")
	// ErrInvalidValue 无效的值
	ErrInvalidValue = errors.New("invalid value")
	// ErrConnectionFailed 连接失败
	ErrConnectionFailed = errors.New("connection failed")
	// ErrSerialization 序列化错误
	ErrSerialization = errors.New("serialization error")
	// ErrDeserialization 反序列化错误
	ErrDeserialization = errors.New("deserialization error")
)
