package gormutil

import (
	"context"

	"gorm.io/gorm"
)

type txContextKey struct{}

// InjectTx 将事务写入 context，Repo 或 service 可用 GetTx 取回。
func InjectTx(ctx context.Context, tx *gorm.DB) context.Context {
	if ctx == nil {
		ctx = context.Background()
	}
	return context.WithValue(ctx, txContextKey{}, tx)
}

// GetTx 从 context 中提取事务；没有事务时返回 fallback。
func GetTx(ctx context.Context, fallback *gorm.DB) *gorm.DB {
	if ctx == nil {
		return fallback
	}
	if tx, ok := ctx.Value(txContextKey{}).(*gorm.DB); ok && tx != nil {
		return tx
	}
	return fallback
}
