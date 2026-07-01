package sqlfavorite

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
)

type DTO struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"user_id"`
	Name      string    `json:"name"`
	Sql       string    `json:"sql"`
	Scope     string    `json:"scope"`
	ProjectID uint      `json:"project_id"`
	Database  string    `json:"database"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ListQuery struct {
	response.PageQuery
	UserID  uint   `query:"user_id" json:"user_id"`
	Scope   string `query:"scope" json:"scope"`
	Keyword string `query:"keyword" json:"keyword"`
}

type CreateRequest struct {
	Name      string `json:"name"`
	Sql       string `json:"sql"`
	Scope     string `json:"scope"`
	ProjectID uint   `json:"project_id"`
	Database  string `json:"database"`
}

type UpdateRequest struct {
	Name     string `json:"name"`
	Sql      string `json:"sql"`
	Scope    string `json:"scope"`
	Database string `json:"database"`
}

func ToDTO(f *SqlFavorite) *DTO {
	if f == nil {
		return nil
	}
	return &DTO{
		ID:        f.ID,
		UserID:    f.UserID,
		Name:      f.Name,
		Sql:       f.Sql,
		Scope:     f.Scope,
		ProjectID: f.ProjectID,
		Database:  f.Database,
		CreatedAt: f.CreatedAt,
		UpdatedAt: f.UpdatedAt,
	}
}
