package user

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
)

type DTO struct {
	ID        uint      `json:"id"`
	Username  string    `json:"username"`
	Nickname  string    `json:"nickname"`
	RoleCode  string    `json:"role_code"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ListQuery struct {
	response.PageQuery
	Keyword  string `query:"keyword" json:"keyword"`
	Status   string `query:"status" json:"status"`
	RoleCode string `query:"role_code" json:"role_code"`
}

type CreateRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Nickname string `json:"nickname"`
	RoleCode string `json:"role_code"`
	Status   string `json:"status"`
}

type UpdateRequest struct {
	Nickname string `json:"nickname"`
	RoleCode string `json:"role_code"`
	Status   string `json:"status"`
	Password string `json:"password,omitempty"`
}

type UpdateProfileRequest struct {
	Nickname string `json:"nickname"`
	Password string `json:"password,omitempty"`
}

type BatchDeleteRequest struct {
	IDs []uint `json:"ids"`
}

type BatchExportRequest struct {
	IDs []uint `json:"ids"`
}

func ToDTO(u *User) *DTO {
	if u == nil {
		return nil
	}
	return &DTO{
		ID:        u.ID,
		Username:  u.Username,
		Nickname:  u.Nickname,
		RoleCode:  u.RoleCode,
		Status:    u.Status,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}
