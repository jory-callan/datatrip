package stats

import (
	"context"
	"time"

	"czwlinux.cloud/go-friday-starter/features/project"
	"czwlinux.cloud/go-friday-starter/global"
)

func GetDashboardStats(ctx context.Context) (*DashboardStats, error) {
	var stats DashboardStats

	// Project count
	global.DB.WithContext(ctx).Model(&project.DbProject{}).Count(&stats.ProjectCount)

	// Datasource count — query the datasource table directly
	global.DB.WithContext(ctx).Table("datasources").Count(&stats.DatasourceCount)

	// Today's execution count
	todayStart := time.Now().Truncate(24 * time.Hour)
	global.DB.WithContext(ctx).Table("sql_executions").
		Where("created_at >= ?", todayStart).
		Count(&stats.TodayExecCount)

	// Pending ticket count
	global.DB.WithContext(ctx).Table("tickets").
		Where("status = ?", "pending").
		Count(&stats.PendingTicketCount)

	// Recent 20 executions with project names
	var recent []RecentExecution
	global.DB.WithContext(ctx).
		Table("sql_executions").
		Select("sql_executions.id, sql_executions.project_id, COALESCE(p.name,'') as project_name, sql_executions.sql, sql_executions.classification, sql_executions.status, sql_executions.duration_ms, sql_executions.created_at").
		Joins("LEFT JOIN db_projects p ON p.id = sql_executions.project_id").
		Order("sql_executions.id desc").
		Limit(20).
		Scan(&recent)
	if recent == nil {
		recent = []RecentExecution{}
	}
	stats.RecentExecutions = recent

	return &stats, nil
}
