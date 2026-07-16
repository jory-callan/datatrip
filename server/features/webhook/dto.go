package webhook

import (
	"time"
)

type DTO struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Scope     string    `json:"scope"`
	ProjectID string    `json:"project_id"`
	URL       string    `json:"url"`
	Enabled   bool      `json:"enabled"`
	Events    []string  `json:"events"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateRequest struct {
	Name      string   `json:"name"`
	Scope     string   `json:"scope"`
	ProjectID string   `json:"project_id"`
	URL       string   `json:"url"`
	Enabled   bool     `json:"enabled"`
	Events    []string `json:"events"`
}

type UpdateRequest struct {
	Name    string   `json:"name"`
	URL     string   `json:"url"`
	Enabled bool     `json:"enabled"`
	Events  []string `json:"events"`
}

func ToDTO(w *Webhook) *DTO {
	if w == nil {
		return nil
	}
	return &DTO{
		ID:        w.ID,
		Name:      w.Name,
		Scope:     w.Scope,
		ProjectID: w.ProjectID,
		URL:       w.URL,
		Enabled:   w.Enabled,
		Events:    splitEvents(w.Events),
		CreatedAt: w.CreatedAt,
		UpdatedAt: w.UpdatedAt,
	}
}

func splitEvents(s string) []string {
	if s == "" {
		return nil
	}
	var result []string
	var start int
	for i, c := range s {
		if c == ',' {
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

func joinEvents(events []string) string {
	if len(events) == 0 {
		return ""
	}
	b := make([]byte, 0, len(events)*20)
	for i, e := range events {
		if i > 0 {
			b = append(b, ',')
		}
		b = append(b, []byte(e)...)
	}
	return string(b)
}
