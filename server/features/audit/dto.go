package audit

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
)

type DTO struct {
	ID             uint      `json:"id"`
	ActorID        uint      `json:"actor_id"`
	ProjectID      uint      `json:"project_id"`
	DatasourceID   uint      `json:"datasource_id"`
	Action         string    `json:"action"`
	Sql            string    `json:"sql"`
	Classification string    `json:"classification"`
	Status         string    `json:"status"`
	DurationMs     int       `json:"duration_ms"`
	ErrorMessage   string    `json:"error_message"`
	TicketID       uint      `json:"ticket_id"`
	IP             string    `json:"ip"`
	CreatedAt      time.Time `json:"created_at"`
}

type ListQuery struct {
	response.PageQuery
	ActorID      uint   `query:"actor_id" json:"actor_id"`
	ProjectID    uint   `query:"project_id" json:"project_id"`
	DatasourceID uint   `query:"datasource_id" json:"datasource_id"`
	Action       string `query:"action" json:"action"`
	Status       string `query:"status" json:"status"`
	Classification string `query:"classification" json:"classification"`
	StartTime    string `query:"start_time" json:"start_time"`
	EndTime      string `query:"end_time" json:"end_time"`
}

type CreateAuditLogRequest struct {
	ActorID       uint
	ProjectID     uint
	DatasourceID  uint
	Action        string
	Sql           string
	Classification string
	Status        string
	DurationMs    int
	ErrorMessage  string
	TicketID      uint
	IP            string
}

func ToDTO(a *AuditLog) *DTO {
	if a == nil {
		return nil
	}
	return &DTO{
		ID:             a.ID,
		ActorID:        a.ActorID,
		ProjectID:      a.ProjectID,
		DatasourceID:   a.DatasourceID,
		Action:         a.Action,
		Sql:            a.Sql,
		Classification: a.Classification,
		Status:         a.Status,
		DurationMs:     a.DurationMs,
		ErrorMessage:   a.ErrorMessage,
		TicketID:       a.TicketID,
		IP:             a.IP,
		CreatedAt:      a.CreatedAt,
	}
}
