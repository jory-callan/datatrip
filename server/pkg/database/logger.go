package database

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/logger"
	"go.uber.org/zap"
	"gorm.io/gorm"
	gormlogx "gorm.io/gorm/logger"
)

// gormLogger GORM日志适配器
type gormLogger struct {
	level         gormlogx.LogLevel
	logger        *logger.Logger
	slowThreshold time.Duration
}

// newGormLogger 创建GORM日志适配器
func newGormLogger(level string, logger *logger.Logger, slowThreshold time.Duration) gormlogx.Interface {
	var gormLevel gormlogx.LogLevel
	switch strings.ToLower(level) {
	case "silent":
		gormLevel = gormlogx.Silent
	case "error":
		gormLevel = gormlogx.Error
	case "warn":
		gormLevel = gormlogx.Warn
	case "info":
		gormLevel = gormlogx.Info
	default:
		gormLevel = gormlogx.Info
	}
	return &gormLogger{
		level:         gormLevel,
		logger:        logger,
		slowThreshold: slowThreshold,
	}
}

func (l *gormLogger) LogMode(level gormlogx.LogLevel) gormlogx.Interface {
	l.level = level
	return l
}
func (l *gormLogger) Info(ctx context.Context, msg string, data ...interface{}) {
	if l.level >= gormlogx.Info {
		l.info(fmt.Sprintf(msg, data...))
	}
}
func (l *gormLogger) Warn(ctx context.Context, msg string, data ...interface{}) {
	if l.level >= gormlogx.Warn {
		l.warn(fmt.Sprintf(msg, data...))
	}
}
func (l *gormLogger) Error(ctx context.Context, msg string, data ...interface{}) {
	if l.level >= gormlogx.Error {
		l.error(fmt.Sprintf(msg, data...))
	}
}
func (l *gormLogger) Trace(ctx context.Context, begin time.Time, fc func() (string, int64), err error) {
	if l.level <= gormlogx.Silent {
		return
	}

	elapsed := time.Since(begin)
	sql, rows := fc()
	fields := fmt.Sprintf("sql=%s, rows=%d, cost=%s", sql, rows, elapsed)

	switch {
	case err != nil && !errors.Is(err, gorm.ErrRecordNotFound) && l.level >= gormlogx.Error:
		fields = fields + fmt.Sprintf(", error=%s", err)
		l.error("gorm error --> " + fields)
	case elapsed > l.slowThreshold && l.slowThreshold > 0 && l.level >= gormlogx.Warn:
		fields = fields + fmt.Sprintf(", threshold=%s", l.slowThreshold)
		l.warn("slow query --> " + fields)
	case l.level >= gormlogx.Info:
		l.info("gorm query --> " + fields)
	}
}

func (l *gormLogger) info(msg string) {
	if l.logger != nil {
		l.logger.Info(msg)
		return
	}
	zap.L().Info(msg)
}

func (l *gormLogger) warn(msg string) {
	if l.logger != nil {
		l.logger.Warn(msg)
		return
	}
	zap.L().Warn(msg)
}

func (l *gormLogger) error(msg string) {
	if l.logger != nil {
		l.logger.Error(msg)
		return
	}
	zap.L().Error(msg)
}
