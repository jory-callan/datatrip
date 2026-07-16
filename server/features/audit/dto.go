package audit

import (
	"time"
)

type DTO struct {
	ID              string    `json:"id"`
	ActorID         string    `json:"actor_id"`
	ProjectID       string    `json:"project_id"`
	DatasourceID    string    `json:"datasource_id"`
	Action          string    `json:"action"`
	RawText         string    `json:"raw_text"`
	InstructionJSON string    `json:"instruction_json"`
	Classification  string    `json:"classification"`
	Status          string    `json:"status"`
	DurationMs      int       `json:"duration_ms"`
	ErrorMessage    string    `json:"error_message"`
	TicketID        string    `json:"ticket_id"`
	IP              string    `json:"ip"`
	CreatedAt       time.Time `json:"created_at"`
}

type CreateAuditLogRequest struct {
	ActorID         string
	ProjectID       string
	DatasourceID    string
	Action          string
	RawText         string
	InstructionJSON string
	Classification  string
	Status          string
	DurationMs      int
	ErrorMessage    string
	TicketID        string
	IP              string
}

func ToDTO(a *AuditLog) *DTO {
	if a == nil {
		return nil
	}
	return &DTO{
		ID:              a.ID,
		ActorID:         a.ActorID,
		ProjectID:       a.ProjectID,
		DatasourceID:    a.DatasourceID,
		Action:          a.Action,
		RawText:         a.RawText,
		InstructionJSON: a.InstructionJSON,
		Classification:  a.Classification,
		Status:          a.Status,
		DurationMs:      a.DurationMs,
		ErrorMessage:    a.ErrorMessage,
		TicketID:        a.TicketID,
		IP:              a.IP,
		CreatedAt:       a.CreatedAt,
	}
}
