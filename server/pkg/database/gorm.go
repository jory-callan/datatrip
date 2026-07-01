package database

import (
	"fmt"
	"strings"

	"czwlinux.cloud/go-friday-starter/pkg/logger"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

// New 根据 Config 创建 *gorm.DB 实例
func New(cfg Config, logger *logger.Logger) (*gorm.DB, error) {
	dialector, err := getDialector(cfg.Driver, cfg.DSN)
	if err != nil {
		return nil, err
	}

	// 配置命名策略
	ns := schema.NamingStrategy{
		SingularTable: true,            // 单数表名
		TablePrefix:   cfg.TablePrefix, // 表名前缀
	}

	// 创建 GORM 配置
	gormCfg := &gorm.Config{
		Logger:                                   newGormLogger(cfg.LogLevel, logger, cfg.SlowThreshold),
		SkipDefaultTransaction:                   true, // 跳过默认每条的事务，提高性能
		PrepareStmt:                              true, // 预编译语句，提高性能
		DisableForeignKeyConstraintWhenMigrating: true, // 禁用外键约束，避免迁移时的循环依赖问题
		NamingStrategy:                           ns,   // 配置命名策略
	}
	db, err := gorm.Open(dialector, gormCfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect database (driver=%s): %w", cfg.Driver, err)
	}

	// 获取底层 sql.DB 以配置连接池
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.ConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(cfg.ConnMaxIdleTime)

	if logger != nil {
		logger.SugarLogger().Infow("database connection established", "driver", cfg.Driver, "max_open", cfg.MaxOpenConns, "max_idle", cfg.MaxIdleConns)
	}
	return db, nil
}

// getDialector 根据驱动类型返回对应的 Dialector
func getDialector(driver, dsn string) (gorm.Dialector, error) {
	switch strings.ToLower(strings.TrimSpace(driver)) {
	case "mysql":
		return mysql.Open(dsn), nil
	case "postgres", "postgresql", "pg", "pgsql":
		return postgres.Open(dsn), nil
	case "sqlite", "sqlite3":
		return sqlite.Open(dsn), nil
	default:
		return nil, fmt.Errorf("unsupported database driver: %s", driver)
	}
}

func Shutdown(db *gorm.DB) {
	if db == nil {
		return
	}

	sqlDB, _ := db.DB()
	if sqlDB != nil {
		sqlDB.Close()
	}
}
