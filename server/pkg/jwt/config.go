package jwt

import "time"

const DefaultSecret = "change-me-in-production"

// Config JWT 配置。
// 时间字段统一使用 time.Duration 字符串，例如: 24h、7d、1y。
type Config struct {
	Secret  string        `mapstructure:"secret" yaml:"secret" json:"secret"`
	Expires time.Duration `mapstructure:"expires" yaml:"expires" json:"expires"`
	Issuer  string        `mapstructure:"issuer" yaml:"issuer" json:"issuer"`
}

func DefaultConfig() Config {
	return Config{
		Secret:  DefaultSecret,
		Expires: 24 * time.Hour,
		Issuer:  "go-friday-starter",
	}
}
