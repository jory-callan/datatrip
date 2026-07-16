package driver

import (
	"context"
	"crypto/tls"
	"fmt"
	"net/http"
	"time"

	"github.com/elastic/go-elasticsearch/v8"
)

// ESConfig 从 ConnConfig 构建 Elasticsearch 配置。
func ESConfig(cfg ConnConfig) elasticsearch.Config {
	proto := "http"
	if cfg.Password != "" {
		proto = "https"
	}
	addresses := []string{fmt.Sprintf("%s://%s:%d", proto, cfg.Host, cfg.Port)}

	return elasticsearch.Config{
		Addresses:     addresses,
		Username:      cfg.Username,
		Password:      cfg.Password,
		MaxRetries:    3,
		RetryOnStatus: []int{502, 503, 504},
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}
}

// NewESClient 创建 ES 客户端并测试连接。
func NewESClient(cfg ConnConfig) (*elasticsearch.Client, error) {
	client, err := elasticsearch.NewClient(ESConfig(cfg))
	if err != nil {
		return nil, fmt.Errorf("es new client: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	res, err := client.Ping(client.Ping.WithContext(ctx))
	if err != nil {
		return nil, fmt.Errorf("es ping: %w", err)
	}
	defer res.Body.Close()
	if res.IsError() {
		return nil, fmt.Errorf("es ping failed: %s", res.String())
	}

	return client, nil
}
