package stats

import (
	"context"
	"time"

	"czwlinux.cloud/go-friday-starter/features/datasource"
	"czwlinux.cloud/go-friday-starter/features/exec"
	"czwlinux.cloud/go-friday-starter/features/project"
	"czwlinux.cloud/go-friday-starter/features/ticket"
	"czwlinux.cloud/go-friday-starter/global"
)

func GetDashboardStats(ctx context.Context) (*DashboardStats, error) {
	var stats DashboardStats

	// Project count
	global.DB.WithContext(ctx).Model(&project.DataProject{}).Count(&stats.ProjectCount)

	// Datasource count — query the datasource table directly
	global.DB.WithContext(ctx).Model(&datasource.Datasource{}).Count(&stats.DatasourceCount)

	// Today's execution count
	todayStart := time.Now().Truncate(24 * time.Hour)
	global.DB.WithContext(ctx).Model(&exec.SqlExecution{}).
		Where("created_at >= ?", todayStart).
		Count(&stats.TodayExecCount)

	// Pending ticket count
	global.DB.WithContext(ctx).Model(&ticket.Ticket{}).
		Where("status = ?", "pending").
		Count(&stats.PendingTicketCount)

	// Recent 20 executions with project names
	var recent []RecentExecution
	global.DB.WithContext(ctx).
		Model(&exec.SqlExecution{}).
		Select("sql_execution.id, sql_execution.project_id, COALESCE(p.name,'') as project_name, sql_execution.sql, sql_execution.classification, sql_execution.status, sql_execution.duration_ms, sql_execution.created_at").
		Joins("LEFT JOIN data_project p ON p.id = sql_execution.project_id").
		Order("sql_execution.id desc").
		Limit(20).
		Scan(&recent)
	if recent == nil {
		recent = []RecentExecution{}
	}
	stats.RecentExecutions = recent

	return &stats, nil
}
