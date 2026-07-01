package config

import (
	"fmt"
	"log"
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/mitchellh/mapstructure"
	"github.com/spf13/viper"
)

var durationPattern = regexp.MustCompile(`(?i)([0-9]+)(ns|us|µs|ms|s|m|h|d|y)`)

// Load 加载配置文件并返回强类型 AppConfig。
// 流程: DefaultConfig() → ReadInConfig() → Unmarshal(&cfg)。
// 配置文件未指定的字段保留 DefaultConfig() 中的默认值。
func Load(configFile string) *AppConfig {
	v := viper.New()
	v.SetConfigType("yaml")

	// 环境变量配置：APP_HTTP_PORT / APP_DATABASE_DSN 等。
	v.SetEnvPrefix("APP")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	if configFile != "" {
		v.SetConfigFile(configFile)
	} else {
		for _, p := range []string{".", "./config", "./conf"} {
			v.AddConfigPath(p)
		}
		v.SetConfigName("config")
	}

	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			panic(fmt.Sprintf("read config: %v", err))
		}
		log.Println("config file not found, using default configuration")
	}

	cfg := DefaultConfig()
	decodeHook := mapstructure.ComposeDecodeHookFunc(
		stringToDurationHook(),
	)
	if err := v.Unmarshal(&cfg, viper.DecodeHook(decodeHook)); err != nil {
		panic(fmt.Sprintf("unmarshal config: %v", err))
	}

	return &cfg
}

func stringToDurationHook() mapstructure.DecodeHookFunc {
	return func(from, to reflect.Type, data any) (any, error) {
		if from.Kind() != reflect.String || to != reflect.TypeOf(time.Duration(0)) {
			return data, nil
		}
		return ParseDuration(data.(string))
	}
}

// ParseDuration 支持 Go 原生 duration，并额外支持 d/y：10s、1h、1d、1y。
// y 固定按 365d 计算，适合配置过期时间/保留时间，不表达自然年历。
func ParseDuration(s string) (time.Duration, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0, nil
	}

	if d, err := time.ParseDuration(s); err == nil {
		return d, nil
	}

	matches := durationPattern.FindAllStringSubmatch(s, -1)
	if len(matches) == 0 {
		return 0, fmt.Errorf("invalid duration %q", s)
	}

	joined := ""
	var total time.Duration
	for _, m := range matches {
		joined += m[0]
		n, err := strconv.ParseInt(m[1], 10, 64)
		if err != nil {
			return 0, err
		}
		unit := strings.ToLower(m[2])
		switch unit {
		case "ns", "us", "µs", "ms", "s", "m", "h":
			d, err := time.ParseDuration(m[1] + unit)
			if err != nil {
				return 0, err
			}
			total += d
		case "d":
			total += time.Duration(n) * 24 * time.Hour
		case "y":
			total += time.Duration(n) * 365 * 24 * time.Hour
		default:
			return 0, fmt.Errorf("unsupported duration unit %q", unit)
		}
	}
	if !strings.EqualFold(joined, strings.ReplaceAll(s, " ", "")) {
		return 0, fmt.Errorf("invalid duration %q", s)
	}
	return total, nil
}
