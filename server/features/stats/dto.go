package stats

import "time"

type DashboardStats struct {
	ProjectCount   int64              `json:"project_count"`
	DatasourceCount int64             `json:"datasource_count"`
	TodayExecCount  int64             `json:"today_exec_count"`
	PendingTicketCount int64          `json:"pending_ticket_count"`
	RecentExecutions []RecentExecution `json:"recent_executions"`
}

type RecentExecution struct {
	ID             uint      `json:"id"`
	ProjectID      uint      `json:"project_id"`
	ProjectName    string    `json:"project_name"`
	Sql            string    `json:"sql"`
	Classification string    `json:"classification"`
	Status         string    `json:"status"`
	DurationMs     int       `json:"duration_ms"`
	CreatedAt      time.Time `json:"created_at"`
}
