package database

import "time"

// Config 数据库配置。
// 所有时间字段统一使用 time.Duration 字符串，例如: 30m、5m、1h、1d、1y。
type Config struct {
	Driver          string        `mapstructure:"driver" yaml:"driver" json:"driver"`
	DSN             string        `mapstructure:"dsn" yaml:"dsn" json:"dsn"`
	MaxOpenConns    int           `mapstructure:"max_open_conns" yaml:"max_open_conns" json:"max_open_conns"`
	MaxIdleConns    int           `mapstructure:"max_idle_conns" yaml:"max_idle_conns" json:"max_idle_conns"`
	ConnMaxLifetime time.Duration `mapstructure:"conn_max_lifetime" yaml:"conn_max_lifetime" json:"conn_max_lifetime"`
	ConnMaxIdleTime time.Duration `mapstructure:"conn_max_idle_time" yaml:"conn_max_idle_time" json:"conn_max_idle_time"`
	LogLevel        string        `mapstructure:"log_level" yaml:"log_level" json:"log_level"`
	SlowThreshold   time.Duration `mapstructure:"slow_threshold" yaml:"slow_threshold" json:"slow_threshold"`
	TablePrefix     string        `mapstructure:"table_prefix" yaml:"table_prefix" json:"table_prefix"`
}

func DefaultConfig() Config {
	return Config{
		Driver:          "sqlite",
		DSN:             "demo.sqlite.db",
		MaxOpenConns:    50,
		MaxIdleConns:    10,
		ConnMaxLifetime: 30 * time.Minute,
		ConnMaxIdleTime: 5 * time.Minute,
		LogLevel:        "warn",
		SlowThreshold:   time.Second,
		TablePrefix:     "",
	}
}
