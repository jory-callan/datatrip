package snippet

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
)

type DTO struct {
	ID             string    `json:"id"`
	UserID         string    `json:"user_id"`
	Name           string    `json:"name"`
	Content        string    `json:"content"`
	DatasourceType string    `json:"datasource_type"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type ListQuery struct {
	response.PageQuery
	UserID         string `query:"user_id" json:"user_id"`
	DatasourceType string `query:"datasource_type" json:"datasource_type"`
	Keyword        string `query:"keyword" json:"keyword"`
}

type CreateRequest struct {
	Name           string `json:"name"`
	Content        string `json:"content"`
	DatasourceType string `json:"datasource_type"`
}

type UpdateRequest struct {
	Name           string `json:"name"`
	Content        string `json:"content"`
	DatasourceType string `json:"datasource_type,omitempty"`
}

func ToDTO(s *Snippet) *DTO {
	if s == nil {
		return nil
	}
	return &DTO{
		ID:             s.ID,
		UserID:         s.UserID,
		Name:           s.Name,
		Content:        s.Content,
		DatasourceType: s.DatasourceType,
		CreatedAt:      s.CreatedAt,
		UpdatedAt:      s.UpdatedAt,
	}
}
