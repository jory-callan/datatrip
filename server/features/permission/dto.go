package permission

import "time"

type DTO struct {
	ID          string    `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Module      string    `json:"module"`
	IsSystem    bool      `json:"is_system"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateRequest struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Module      string `json:"module"`
}

type UpdateRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Module      string `json:"module"`
}

type ListQuery struct {
	Module string `query:"module" json:"module"`
}

func ToDTO(p *Permission) *DTO {
	if p == nil {
		return nil
	}
	return &DTO{
		ID:          p.ID,
		Code:        p.Code,
		Name:        p.Name,
		Description: p.Description,
		Module:      p.Module,
		IsSystem:    p.IsSystem,
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}
}
