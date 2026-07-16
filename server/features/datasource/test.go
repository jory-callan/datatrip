package datasource

import (
	"context"
	"database/sql"
	"fmt"
	"net"
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/driver"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/jackc/pgx/v5/stdlib"
)

// TestConnection 测试数据源连接，使用临时连接，测试完成后关闭
func TestConnection(ctx context.Context, id string) (bool, string) {
	d, err := GetByID(ctx, id)
	if err != nil {
		return false, "数据源不存在"
	}

	driverName, dsn := buildDSN(d)
	if driverName == "" {
		return false, "不支持的数据库类型"
	}

	conn, err := net.DialTimeout("tcp", net.JoinHostPort(d.Host, fmt.Sprintf("%d", d.Port)), 10*time.Second)
	if err != nil {
		_ = Save(ctx, d.WithStatus(StatusError))
		return false, fmt.Sprintf("连接失败: %v", err)
	}
	conn.Close()

	db, err := sql.Open(driverName, dsn)
	if err != nil {
		_ = Save(ctx, d.WithStatus(StatusError))
		return false, fmt.Sprintf("打开连接失败: %v", err)
	}
	defer db.Close()

	db.SetConnMaxLifetime(10 * time.Second)
	if err := db.PingContext(ctx); err != nil {
		_ = Save(ctx, d.WithStatus(StatusError))
		return false, fmt.Sprintf("Ping 失败: %v", err)
	}

	_ = Save(ctx, d.WithStatus(StatusConnected))
	return true, "连接成功"
}

func buildDSN(d *Datasource) (string, string) {
	c, err := driver.GetSQLConnector(d.Type)
	if err != nil {
		return "", ""
	}
	return c.DSN(driver.ConnConfig{
		Type:     d.Type,
		Host:     d.Host,
		Port:     d.Port,
		Username: d.Username,
		Password: d.Password,
		Database: d.Database,
	})
}
