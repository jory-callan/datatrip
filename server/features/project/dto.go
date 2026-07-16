package project

import (
	"strings"
	"time"
)

type DTO struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	DatasourceID string    `json:"datasource_id"`
	Scope        []string  `json:"scope"`
	ApprovalMode string    `json:"approval_mode"`
	WebhookIDs   []string  `json:"webhook_ids"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type MemberDTO struct {
	ID        string    `json:"id"`
	ProjectID string    `json:"project_id"`
	UserID    string    `json:"user_id"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateRequest struct {
	Name         string   `json:"name"`
	DatasourceID string   `json:"datasource_id"`
	Scope        []string `json:"scope"`
	ApprovalMode string   `json:"approval_mode"`
	WebhookIDs   []string `json:"webhook_ids"`
}

type UpdateRequest struct {
	Name         string   `json:"name"`
	Scope        []string `json:"scope"`
	ApprovalMode string   `json:"approval_mode"`
	WebhookIDs   []string `json:"webhook_ids"`
}

type BatchDeleteRequest struct {
	IDs []string `json:"ids"`
}

type UpdateMembersRequest struct {
	Members []MemberInput `json:"members"`
}

type MemberInput struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
}

func joinStrings(strs []string) string {
	if len(strs) == 0 {
		return ""
	}
	b := make([]byte, 0, len(strs)*20)
	for i, s := range strs {
		if i > 0 {
			b = append(b, ',')
		}
		b = append(b, []byte(s)...)
	}
	return string(b)
}

func splitStrings(s string) []string {
	if s == "" {
		return nil
	}
	var result []string
	var start int
	for i, c := range s {
		if c == ',' || c == '，' {
			if i > start {
				result = append(result, s[start:i])
			}
			start = i + 1
		}
	}
	if start < len(s) {
		result = append(result, s[start:])
	}
	return result
}

func ToDTO(p *DataProject) *DTO {
	if p == nil {
		return nil
	}
	var scope []string
	if p.Scope != "" {
		scope = splitStrings(p.Scope)
	}
	return &DTO{
		ID:           p.ID,
		Name:         p.Name,
		DatasourceID: p.DatasourceID,
		Scope:        scope,
		ApprovalMode: p.ApprovalMode,
		WebhookIDs:   splitIDs(p.WebhookIDs),
		CreatedAt:    p.CreatedAt,
		UpdatedAt:    p.UpdatedAt,
	}
}

func ToMemberDTO(m *DataProjectMember) *MemberDTO {
	if m == nil {
		return nil
	}
	return &MemberDTO{
		ID:        m.ID,
		ProjectID: m.ProjectID,
		UserID:    m.UserID,
		Role:      m.Role,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}

func joinIDs(ids []string) string {
	if len(ids) == 0 {
		return ""
	}
	b := make([]byte, 0, len(ids)*33)
	for i, id := range ids {
		if i > 0 {
			b = append(b, ',')
		}
		b = append(b, []byte(id)...)
	}
	return string(b)
}

func splitIDs(s string) []string {
	if s == "" {
		return nil
	}
	var ids []string
	for _, part := range strings.Split(s, ",") {
		part = strings.TrimSpace(part)
		if part != "" {
			ids = append(ids, part)
		}
	}
	return ids
}
