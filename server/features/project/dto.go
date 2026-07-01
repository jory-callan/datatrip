package project

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
)

type DTO struct {
	ID                uint      `json:"id"`
	Name              string    `json:"name"`
	DatasourceID      uint      `json:"datasource_id"`
	Databases         []string  `json:"databases"`
	ApprovalMode      string    `json:"approval_mode"`
	ApproverIDs       []uint    `json:"approver_ids"`
	AutoMatchApprover bool      `json:"auto_match_approver"`
	WebhookIDs        []uint    `json:"webhook_ids"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type MemberDTO struct {
	ID        uint      `json:"id"`
	ProjectID uint      `json:"project_id"`
	UserID    uint      `json:"user_id"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type ListQuery struct {
	response.PageQuery
	Keyword        string `query:"keyword" json:"keyword"`
	DatasourceID   uint   `query:"datasource_id" json:"datasource_id"`
	ProjectOwnerID uint   `query:"project_owner_id" json:"project_owner_id"`
}

type CreateRequest struct {
	Name           string   `json:"name"`
	DatasourceID   uint     `json:"datasource_id"`
	Databases      []string `json:"databases"`
	ApprovalMode   string   `json:"approval_mode"`
	ApproverIDs    []uint   `json:"approver_ids"`
	AutoMatchApprover bool `json:"auto_match_approver"`
	WebhookIDs     []uint   `json:"webhook_ids"`
}

type UpdateRequest struct {
	Name           string   `json:"name"`
	Databases      []string `json:"databases"`
	ApprovalMode   string   `json:"approval_mode"`
	ApproverIDs    []uint   `json:"approver_ids"`
	AutoMatchApprover bool `json:"auto_match_approver"`
	WebhookIDs     []uint   `json:"webhook_ids"`
}

type UpdateMembersRequest struct {
	Members []MemberInput `json:"members"`
}

type MemberInput struct {
	UserID uint   `json:"user_id"`
	Role   string `json:"role"`
}

func parseIDs(s string) []uint {
	if s == "" {
		return nil
	}
	// 将在 service 中使用真正的解析
	return nil
}

func joinIDs(ids []uint) string {
	if len(ids) == 0 {
		return ""
	}
	b := make([]byte, 0, len(ids)*6)
	for i, id := range ids {
		if i > 0 {
			b = append(b, ',')
		}
		b = append(b, []byte(formatUint(id))...)
	}
	return string(b)
}

func JoinIDs(ids []uint) string {
	if len(ids) == 0 {
		return ""
	}
	b := make([]byte, 0, len(ids)*6)
	for i, id := range ids {
		if i > 0 {
			b = append(b, ',')
		}
		b = append(b, []byte(formatUint(id))...)
	}
	return string(b)
}

func splitIDs(s string) []uint {
	if s == "" {
		return nil
	}
	// simple split
	var ids []uint
	var current uint
	for _, c := range s {
		if c >= '0' && c <= '9' {
			current = current*10 + uint(c-'0')
		} else if c == ',' {
			if current > 0 {
				ids = append(ids, current)
				current = 0
			}
		}
	}
	if current > 0 {
		ids = append(ids, current)
	}
	return ids
}

func formatUint(n uint) string {
	if n == 0 {
		return "0"
	}
	var buf [20]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	return string(buf[i:])
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
	// Split by both English comma and Chinese comma
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

func ToDTO(p *DbProject) *DTO {
	if p == nil {
		return nil
	}
	return &DTO{
		ID:                p.ID,
		Name:              p.Name,
		DatasourceID:      p.DatasourceID,
		Databases:         splitStrings(p.Databases),
		ApprovalMode:      p.ApprovalMode,
		ApproverIDs:       splitIDs(p.ApproverIDs),
		AutoMatchApprover: p.AutoMatchApprover,
		WebhookIDs:        splitIDs(p.WebhookIDs),
		CreatedAt:         p.CreatedAt,
		UpdatedAt:         p.UpdatedAt,
	}
}

func ToMemberDTO(m *ProjectMember) *MemberDTO {
	if m == nil {
		return nil
	}
	return &MemberDTO{
		ID:        m.ID,
		ProjectID: m.ProjectID,
		UserID:    m.UserID,
		Role:      m.Role,
		CreatedAt: m.CreatedAt,
	}
}
