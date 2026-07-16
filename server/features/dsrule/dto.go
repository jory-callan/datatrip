package dsrule

import (
	"time"
)

type DTO struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	TypeGroup string    `json:"type_group"`
	TypeScope string    `json:"type_scope"`
	Category  string    `json:"category"`
	Pattern   string    `json:"pattern"`
	Enabled   bool      `json:"enabled"`
	Priority  int       `json:"priority"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateRequest struct {
	Name      string `json:"name"`
	TypeGroup string `json:"type_group"`
	TypeScope string `json:"type_scope"`
	Category  string `json:"category"`
	Pattern   string `json:"pattern"`
	Enabled   bool   `json:"enabled"`
	Priority  int    `json:"priority"`
}

type BatchDeleteRequest struct {
	IDs []string `json:"ids"`
}

type UpdateRequest struct {
	Name      string `json:"name"`
	TypeGroup string `json:"type_group"`
	TypeScope string `json:"type_scope"`
	Category  string `json:"category"`
	Pattern   string `json:"pattern"`
	Enabled   *bool  `json:"enabled"`
	Priority  *int   `json:"priority"`
}

func ToDTO(r *DatasourceRule) *DTO {
	if r == nil {
		return nil
	}
	return &DTO{
		ID:        r.ID,
		Name:      r.Name,
		TypeGroup: r.TypeGroup,
		TypeScope: r.TypeScope,
		Category:  r.Category,
		Pattern:   r.Pattern,
		Enabled:   r.Enabled,
		Priority:  r.Priority,
		CreatedAt: r.CreatedAt,
		UpdatedAt: r.UpdatedAt,
	}
}
