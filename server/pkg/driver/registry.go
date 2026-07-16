package driver

import (
	"fmt"
	"sync"
)

var (
	sqlMu         sync.RWMutex
	sqlConnectors = make(map[string]SQLConnector) // key = type name (mysql, postgresql, …)
)

// RegisterSQLConnector 注册一个 SQL 类型连接器。
// 通常在 connector 实现的 init() 中调用。
// 相同 type 重复注册会 panic（防止意外覆盖）。
func RegisterSQLConnector(driver string, c SQLConnector) {
	sqlMu.Lock()
	defer sqlMu.Unlock()
	if _, dup := sqlConnectors[driver]; dup {
		panic(fmt.Sprintf("driver: SQLConnector for %q already registered", driver))
	}
	sqlConnectors[driver] = c
}

// GetSQLConnector 获取指定类型的 SQL 连接器。
func GetSQLConnector(driver string) (SQLConnector, error) {
	sqlMu.RLock()
	c, ok := sqlConnectors[driver]
	sqlMu.RUnlock()
	if !ok {
		return nil, fmt.Errorf("unsupported datasource type: %s", driver)
	}
	return c, nil
}
