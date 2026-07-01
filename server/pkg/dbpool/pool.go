package dbpool

import (
	"context"
	"database/sql"
	"fmt"
	"sync"
	"time"

	"czwlinux.cloud/go-friday-starter/features/datasource"
	"czwlinux.cloud/go-friday-starter/global"
	_ "github.com/go-sql-driver/mysql"
	_ "github.com/jackc/pgx/v5/stdlib"
	"go.uber.org/zap"
)

var (
	mu    sync.RWMutex
	pools = make(map[uint]*poolEntry)

	// Idle reaper configuration
	idleTimeout = 30 * time.Minute  // pool idle before close
	reapInterval = 5 * time.Minute  // reaper check interval
)

// poolEntry wraps a *sql.DB with last-used tracking.
type poolEntry struct {
	db       *sql.DB
	lastUsed time.Time
}

// PoolStats holds connection pool statistics for a datasource.
type PoolStats struct {
	DatasourceID   uint      `json:"datasource_id"`
	Active         int       `json:"active"`
	Idle           int       `json:"idle"`
	WaitCount      int64     `json:"wait_count"`
	WaitDuration   string    `json:"wait_duration"`
	LastUsedTime   time.Time `json:"last_used_time"`
	IsConnected    bool      `json:"is_connected"`
}

// Get returns a *sql.DB pool for the given datasource ID.
// Lazily creates the pool if it does not exist.
func Get(ctx context.Context, datasourceID uint) (*sql.DB, error) {
	mu.RLock()
	entry, ok := pools[datasourceID]
	mu.RUnlock()
	if ok {
		entry.lastUsed = time.Now()
		return entry.db, nil
	}

	mu.Lock()
	defer mu.Unlock()

	// double-check
	if entry, ok := pools[datasourceID]; ok {
		entry.lastUsed = time.Now()
		return entry.db, nil
	}

	ds, err := datasource.GetByID(ctx, datasourceID)
	if err != nil {
		return nil, fmt.Errorf("datasource not found: %w", err)
	}

	dsn, driverName := buildDSN(ds)
	db, err := sql.Open(driverName, dsn)
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
	global.Log.Info("dbpool created", zap.Uint("datasource_id", datasourceID), zap.String("type", ds.Type))
	return db, nil
}

// Close closes and removes the pool for the given datasource ID.
func Close(datasourceID uint) {
	mu.Lock()
	defer mu.Unlock()
	if entry, ok := pools[datasourceID]; ok {
		entry.db.Close()
		delete(pools, datasourceID)
		global.Log.Info("dbpool closed", zap.Uint("datasource_id", datasourceID))
	}
}

// CloseAll closes all pools. Used during shutdown.
func CloseAll() {
	mu.Lock()
	defer mu.Unlock()
	for id, entry := range pools {
		entry.db.Close()
		delete(pools, id)
	}
	global.Log.Info("dbpool: all pools closed")
}

// Reset removes all pools (for testing).
func Reset() {
	mu.Lock()
	defer mu.Unlock()
	for id, entry := range pools {
		entry.db.Close()
		delete(pools, id)
	}
}

// GetPoolStats returns connection pool statistics for a specific datasource.
func GetPoolStats(datasourceID uint) *PoolStats {
	mu.RLock()
	entry, ok := pools[datasourceID]
	mu.RUnlock()

	stats := &PoolStats{
		DatasourceID: datasourceID,
		IsConnected:  ok,
	}
	if ok {
		stats.LastUsedTime = entry.lastUsed
		stats.Active = entry.db.Stats().InUse
		stats.Idle = entry.db.Stats().Idle
		stats.WaitCount = entry.db.Stats().WaitCount
		stats.WaitDuration = entry.db.Stats().WaitDuration.String()
	}
	return stats
}

// ListAllPoolStats returns connection pool statistics for all active pools.
func ListAllPoolStats() []*PoolStats {
	mu.RLock()
	defer mu.RUnlock()
	result := make([]*PoolStats, 0, len(pools))
	for id, entry := range pools {
		stats := &PoolStats{
			DatasourceID: id,
			IsConnected:  true,
			LastUsedTime: entry.lastUsed,
		}
		stats.Active = entry.db.Stats().InUse
		stats.Idle = entry.db.Stats().Idle
		stats.WaitCount = entry.db.Stats().WaitCount
		stats.WaitDuration = entry.db.Stats().WaitDuration.String()
		result = append(result, stats)
	}
	return result
}

// StartReaper starts a background goroutine that closes idle connection pools.
// Call once during server startup (e.g., from cmd/service/start.go).
func StartReaper() {
	go func() {
		ticker := time.NewTicker(reapInterval)
		defer ticker.Stop()
		for range ticker.C {
			reapIdlePools()
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
			global.Log.Info("dbpool reaped idle pool", zap.Uint("datasource_id", id))
		}
	}
}

func buildDSN(ds *datasource.Datasource) (string, string) {
	switch ds.Type {
	case datasource.TypeMySQL:
		// user:password@tcp(host:port)/dbname?charset=utf8mb4&parseTime=True
		dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
			ds.Username, ds.Password, ds.Host, ds.Port, ds.Database)
		return dsn, "mysql"
	case datasource.TypePostgreSQL:
		// postgres://user:***@host:port/dbname?sslmode=disable
		dsn := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=disable",
			ds.Username, ds.Password, ds.Host, ds.Port, ds.Database)
		return dsn, "pgx"
	default:
		return "", ""
	}
}
