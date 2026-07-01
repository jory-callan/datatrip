package dsrule

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
)

type DTO struct {
	ID        uint      `json:"id"`
	Name      string    `json:"name"`
	DBType    string    `json:"db_type"`
	Category  string    `json:"category"`
	Pattern   string    `json:"pattern"`
	Enabled   bool      `json:"enabled"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ListQuery struct {
	response.PageQuery
	DBType   string `query:"db_type" json:"db_type"`
	Category string `query:"category" json:"category"`
	Enabled  string `query:"enabled" json:"enabled"`
}

type CreateRequest struct {
	Name     string `json:"name"`
	DBType   string `json:"db_type"`
	Category string `json:"category"`
	Pattern  string `json:"pattern"`
	Enabled  bool   `json:"enabled"`
}

type UpdateRequest struct {
	Name     string `json:"name"`
	Category string `json:"category"`
	Pattern  string `json:"pattern"`
	Enabled  *bool  `json:"enabled"`
}

func ToDTO(r *DatasourceRule) *DTO {
	if r == nil {
		return nil
	}
	return &DTO{
		ID:        r.ID,
		Name:      r.Name,
		DBType:    r.DBType,
		Category:  r.Category,
		Pattern:   r.Pattern,
		Enabled:   r.Enabled,
		CreatedAt: r.CreatedAt,
		UpdatedAt: r.UpdatedAt,
	}
}
