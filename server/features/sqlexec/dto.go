package sqlexec

import (
	"time"
)

type DTO struct {
	ID             uint      `json:"id"`
	ProjectID      uint      `json:"project_id"`
	Sql            string    `json:"sql"`
	Statements     string    `json:"statements"`
	Classification string    `json:"classification"`
	Status         string    `json:"status"`
	RowCount       int       `json:"row_count"`
	AffectedRows   int       `json:"affected_rows"`
	DurationMs     int       `json:"duration_ms"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type ExecuteRequest struct {
	ProjectID    uint   `json:"project_id"`
	Database     string `json:"database"`
	Sql          string `json:"sql"`
	SelectedText string `json:"selected_text"`
}

type ExecuteResponse struct {
	Mode     string `json:"mode"` // "direct" or "ticket"
	Data     any    `json:"data,omitempty"`
	TicketID uint   `json:"ticket_id,omitempty"`
}

type QueryResult struct {
	Columns []string `json:"columns"`
	Rows    [][]any  `json:"rows"`
	Total   int      `json:"total"`
}

func ToDTO(e *SqlExecution) *DTO {
	if e == nil {
		return nil
	}
	return &DTO{
		ID:             e.ID,
		ProjectID:      e.ProjectID,
		Sql:            e.Sql,
		Statements:     e.Statements,
		Classification: e.Classification,
		Status:         e.Status,
		RowCount:       e.RowCount,
		AffectedRows:   e.AffectedRows,
		DurationMs:     e.DurationMs,
		CreatedAt:      e.CreatedAt,
		UpdatedAt:      e.UpdatedAt,
	}
}
