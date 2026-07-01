package datasource

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
)

type DTO struct {
	ID           uint      `json:"id"`
	Name         string    `json:"name"`
	Type         string    `json:"type"`
	Host         string    `json:"host"`
	Port         int       `json:"port"`
	Username     string    `json:"username"`
	PasswordSaved bool     `json:"password_saved"`
	Remark       string    `json:"remark"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type ListQuery struct {
	response.PageQuery
	Keyword string `query:"keyword" json:"keyword"`
	Type    string `query:"type" json:"type"`
	Status  string `query:"status" json:"status"`
}

type CreateRequest struct {
	Name     string `json:"name"`
	Type     string `json:"type"`
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
	Database string `json:"database"`
	Remark   string `json:"remark"`
}

type UpdateRequest struct {
	Name     string `json:"name"`
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Username string `json:"username"`
	Password string `json:"password,omitempty"`
	Status   string `json:"status"`
	Remark   string `json:"remark"`
}

func ToDTO(d *Datasource) *DTO {
	if d == nil {
		return nil
	}
	return &DTO{
		ID:            d.ID,
		Name:          d.Name,
		Type:          d.Type,
		Host:          d.Host,
		Port:          d.Port,
		Username:      d.Username,
		PasswordSaved: d.Password != "",
		Remark:        d.Remark,
		Status:        d.Status,
		CreatedAt:     d.CreatedAt,
		UpdatedAt:     d.UpdatedAt,
	}
}
