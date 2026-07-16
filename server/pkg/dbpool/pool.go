package dbpool

import (
	"context"
	"database/sql"
	"fmt"
	"sync"
	"time"

	"czwlinux.cloud/go-friday-starter/features/datasource"
	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/driver"
	"github.com/elastic/go-elasticsearch/v8"
	_ "github.com/go-sql-driver/mysql"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/mongo"
	"go.uber.org/zap"
)

var (
	mu    sync.RWMutex
	pools = make(map[string]*poolEntry)

	redisMu    sync.RWMutex
	redisPools = make(map[string]*redisPoolEntry)

	mongoMu    sync.RWMutex
	mongoPools = make(map[string]*mongoPoolEntry)

	esMu    sync.RWMutex
	esPools = make(map[string]*esPoolEntry)

	idleTimeout  = 30 * time.Minute
	reapInterval = 5 * time.Minute
)

type poolEntry struct {
	db       *sql.DB
	lastUsed time.Time
}

type redisPoolEntry struct {
	client   *redis.Client
	lastUsed time.Time
}

type mongoPoolEntry struct {
	client   *mongo.Client
	lastUsed time.Time
}

type esPoolEntry struct {
	client   *elasticsearch.Client
	lastUsed time.Time
}

type PoolStats struct {
	DatasourceID string    `json:"datasource_id"`
	Type         string    `json:"type"`
	Active       int       `json:"active"`
	Idle         int       `json:"idle"`
	WaitCount    int64     `json:"wait_count"`
	WaitDuration string    `json:"wait_duration"`
	LastUsedTime time.Time `json:"last_used_time"`
	IsConnected  bool      `json:"is_connected"`
}

// Get 获取或创建 SQL 连接池
func Get(ctx context.Context, datasourceID string) (*sql.DB, error) {
	mu.RLock()
	entry, ok := pools[datasourceID]
	mu.RUnlock()
	if ok {
		entry.lastUsed = time.Now()
		return entry.db, nil
	}

	mu.Lock()
	defer mu.Unlock()

	if entry, ok := pools[datasourceID]; ok {
		entry.lastUsed = time.Now()
		return entry.db, nil
	}

	ds, err := datasource.GetByID(ctx, datasourceID)
	if err != nil {
		return nil, fmt.Errorf("datasource not found: %w", err)
	}

	driverName, dsnStr := buildDSN(ds)
	db, err := sql.Open(driverName, dsnStr)
	if err != nil {
		return nil, fmt.Errorf("sql open: %w", err)
	}

	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(2)
	db.SetConnMaxLifetime(30 * time.Minute)

	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("dsn ping failed: %w", err)
	}

	pools[datasourceID] = &poolEntry{db: db, lastUsed: time.Now()}
	global.Log.Info("dbpool created", zap.String("datasource_id", datasourceID), zap.String("type", ds.Type))
	return db, nil
}

// GetRedis 获取或创建 Redis 连接
func GetRedis(ctx context.Context, datasourceID string) (*redis.Client, error) {
	redisMu.RLock()
	entry, ok := redisPools[datasourceID]
	redisMu.RUnlock()
	if ok {
		entry.lastUsed = time.Now()
		return entry.client, nil
	}

	redisMu.Lock()
	defer redisMu.Unlock()

	if entry, ok := redisPools[datasourceID]; ok {
		entry.lastUsed = time.Now()
		return entry.client, nil
	}

	ds, err := datasource.GetByID(ctx, datasourceID)
	if err != nil {
		return nil, fmt.Errorf("datasource not found: %w", err)
	}

	opts := driver.RedisOptions(toConnConfig(ds))
	client := redis.NewClient(opts)

	if err := client.Ping(ctx).Err(); err != nil {
		client.Close()
		return nil, fmt.Errorf("redis ping failed: %w", err)
	}

	redisPools[datasourceID] = &redisPoolEntry{client: client, lastUsed: time.Now()}
	global.Log.Info("redis pool created", zap.String("datasource_id", datasourceID))
	return client, nil
}

// GetMongo 获取或创建 MongoDB 连接
func GetMongo(ctx context.Context, datasourceID string) (*mongo.Client, error) {
	mongoMu.RLock()
	entry, ok := mongoPools[datasourceID]
	mongoMu.RUnlock()
	if ok {
		entry.lastUsed = time.Now()
		return entry.client, nil
	}

	mongoMu.Lock()
	defer mongoMu.Unlock()

	if entry, ok := mongoPools[datasourceID]; ok {
		entry.lastUsed = time.Now()
		return entry.client, nil
	}

	ds, err := datasource.GetByID(ctx, datasourceID)
	if err != nil {
		return nil, fmt.Errorf("datasource not found: %w", err)
	}

	client, err := driver.ConnectMongo(ctx, toConnConfig(ds))
	if err != nil {
		return nil, err
	}

	mongoPools[datasourceID] = &mongoPoolEntry{client: client, lastUsed: time.Now()}
	global.Log.Info("mongo pool created", zap.String("datasource_id", datasourceID))
	return client, nil
}

// GetES 获取或创建 Elasticsearch 连接
func GetES(ctx context.Context, datasourceID string) (*elasticsearch.Client, error) {
	esMu.RLock()
	entry, ok := esPools[datasourceID]
	esMu.RUnlock()
	if ok {
		entry.lastUsed = time.Now()
		return entry.client, nil
	}

	esMu.Lock()
	defer esMu.Unlock()

	if entry, ok := esPools[datasourceID]; ok {
		entry.lastUsed = time.Now()
		return entry.client, nil
	}

	ds, err := datasource.GetByID(ctx, datasourceID)
	if err != nil {
		return nil, fmt.Errorf("datasource not found: %w", err)
	}

	client, err := driver.NewESClient(toConnConfig(ds))
	if err != nil {
		return nil, err
	}

	esPools[datasourceID] = &esPoolEntry{client: client, lastUsed: time.Now()}
	global.Log.Info("es pool created", zap.String("datasource_id", datasourceID))
	return client, nil
}

func Close(datasourceID string) {
	mu.Lock()
	if entry, ok := pools[datasourceID]; ok {
		entry.db.Close()
		delete(pools, datasourceID)
	}
	mu.Unlock()

	redisMu.Lock()
	if entry, ok := redisPools[datasourceID]; ok {
		entry.client.Close()
		delete(redisPools, datasourceID)
	}
	redisMu.Unlock()

	mongoMu.Lock()
	if entry, ok := mongoPools[datasourceID]; ok {
		entry.client.Disconnect(context.Background())
		delete(mongoPools, datasourceID)
	}
	mongoMu.Unlock()

	esMu.Lock()
	if _, ok := esPools[datasourceID]; ok {
		// ES client has no Close, it's HTTP-based
		delete(esPools, datasourceID)
	}
	esMu.Unlock()
}

func CloseAll() {
	mu.Lock()
	for id, entry := range pools {
		entry.db.Close()
		delete(pools, id)
	}
	mu.Unlock()

	redisMu.Lock()
	for id, entry := range redisPools {
		entry.client.Close()
		delete(redisPools, id)
	}
	redisMu.Unlock()

	mongoMu.Lock()
	for id, entry := range mongoPools {
		entry.client.Disconnect(context.Background())
		delete(mongoPools, id)
	}
	mongoMu.Unlock()

	esMu.Lock()
	for id, _ := range esPools {
		delete(esPools, id)
	}
	esMu.Unlock()

	global.Log.Info("dbpool: all pools closed")
}

func Reset() {
	mu.Lock()
	for id, entry := range pools {
		entry.db.Close()
		delete(pools, id)
	}
	mu.Unlock()

	redisMu.Lock()
	for id, entry := range redisPools {
		entry.client.Close()
		delete(redisPools, id)
	}
	redisMu.Unlock()

	mongoMu.Lock()
	for id, entry := range mongoPools {
		entry.client.Disconnect(context.Background())
		delete(mongoPools, id)
	}
	mongoMu.Unlock()

	esMu.Lock()
	for id, _ := range esPools {
		delete(esPools, id)
	}
	esMu.Unlock()
}

func GetPoolStats(datasourceID string) *PoolStats {
	stats := &PoolStats{DatasourceID: datasourceID}

	mu.RLock()
	entry, ok := pools[datasourceID]
	mu.RUnlock()
	if ok {
		stats.Type = "sql"
		stats.IsConnected = true
		stats.LastUsedTime = entry.lastUsed
		dbStats := entry.db.Stats()
		stats.Active = dbStats.InUse
		stats.Idle = dbStats.Idle
		stats.WaitCount = dbStats.WaitCount
		stats.WaitDuration = dbStats.WaitDuration.String()
		return stats
	}

	redisMu.RLock()
	rentry, rok := redisPools[datasourceID]
	redisMu.RUnlock()
	if rok {
		stats.Type = "redis"
		stats.IsConnected = true
		stats.LastUsedTime = rentry.lastUsed
		ps := rentry.client.PoolStats()
		stats.Active = int(ps.TotalConns - ps.IdleConns)
		stats.Idle = int(ps.IdleConns)
		return stats
	}

	mongoMu.RLock()
	mentry, mok := mongoPools[datasourceID]
	mongoMu.RUnlock()
	if mok {
		stats.Type = "mongo"
		stats.IsConnected = true
		stats.LastUsedTime = mentry.lastUsed
		return stats
	}

	esMu.RLock()
	eentry, eok := esPools[datasourceID]
	esMu.RUnlock()
	if eok {
		stats.Type = "es"
		stats.IsConnected = true
		stats.LastUsedTime = eentry.lastUsed
		return stats
	}

	return stats
}

func ListAllPoolStats() []*PoolStats {
	var result []*PoolStats

	mu.RLock()
	for id, entry := range pools {
		dbStats := entry.db.Stats()
		result = append(result, &PoolStats{
			DatasourceID: id,
			Type:         "sql",
			IsConnected:  true,
			LastUsedTime: entry.lastUsed,
			Active:       dbStats.InUse,
			Idle:         dbStats.Idle,
			WaitCount:    dbStats.WaitCount,
			WaitDuration: dbStats.WaitDuration.String(),
		})
	}
	mu.RUnlock()

	redisMu.RLock()
	for id, entry := range redisPools {
		ps := entry.client.PoolStats()
		result = append(result, &PoolStats{
			DatasourceID: id,
			Type:         "redis",
			IsConnected:  true,
			LastUsedTime: entry.lastUsed,
			Active:       int(ps.TotalConns - ps.IdleConns),
			Idle:         int(ps.IdleConns),
		})
	}
	redisMu.RUnlock()

	mongoMu.RLock()
	for id, entry := range mongoPools {
		result = append(result, &PoolStats{
			DatasourceID: id,
			Type:         "mongo",
			IsConnected:  true,
			LastUsedTime: entry.lastUsed,
		})
	}
	mongoMu.RUnlock()

	esMu.RLock()
	for id, entry := range esPools {
		result = append(result, &PoolStats{
			DatasourceID: id,
			Type:         "es",
			IsConnected:  true,
			LastUsedTime: entry.lastUsed,
		})
	}
	esMu.RUnlock()

	return result
}

func StartReaper() {
	go func() {
		ticker := time.NewTicker(reapInterval)
		defer ticker.Stop()
		for range ticker.C {
			reapIdlePools()
			reapIdleRedisPools()
			reapIdleMongoPools()
			reapIdleESPools()
		}
	}()
	global.Log.Info("dbpool reaper started", zap.Duration("interval", reapInterval), zap.Duration("idle_timeout", idleTimeout))
}

func reapIdlePools() {
	mu.Lock()
	defer mu.Unlock()
	now := time.Now()
	for id, entry := range pools {
		if now.Sub(entry.lastUsed) > idleTimeout {
			entry.db.Close()
			delete(pools, id)
			global.Log.Info("dbpool reaped idle pool", zap.String("datasource_id", id))
		}
	}
}

func reapIdleRedisPools() {
	redisMu.Lock()
	defer redisMu.Unlock()
	now := time.Now()
	for id, entry := range redisPools {
		if now.Sub(entry.lastUsed) > idleTimeout {
			entry.client.Close()
			delete(redisPools, id)
			global.Log.Info("redis pool reaped idle", zap.String("datasource_id", id))
		}
	}
}

func reapIdleMongoPools() {
	mongoMu.Lock()
	defer mongoMu.Unlock()
	now := time.Now()
	for id, entry := range mongoPools {
		if now.Sub(entry.lastUsed) > idleTimeout {
			entry.client.Disconnect(context.Background())
			delete(mongoPools, id)
			global.Log.Info("mongo pool reaped idle", zap.String("datasource_id", id))
		}
	}
}

func reapIdleESPools() {
	esMu.Lock()
	defer esMu.Unlock()
	now := time.Now()
	for id, entry := range esPools {
		if now.Sub(entry.lastUsed) > idleTimeout {
			delete(esPools, id)
			global.Log.Info("es pool reaped idle", zap.String("datasource_id", id))
		}
	}
}

func toConnConfig(ds *datasource.Datasource) driver.ConnConfig {
	return driver.ConnConfig{
		Type:     ds.Type,
		Host:     ds.Host,
		Port:     ds.Port,
		Username: ds.Username,
		Password: ds.Password,
		Database: ds.Database,
	}
}

func buildDSN(ds *datasource.Datasource) (string, string) {
	c, err := driver.GetSQLConnector(ds.Type)
	if err != nil {
		return "", ""
	}
	return c.DSN(toConnConfig(ds))
}
