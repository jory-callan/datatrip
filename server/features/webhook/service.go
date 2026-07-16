package webhook

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

var (
	ErrNotFound     = errors.New("webhook not found")
	ErrInvalidInput = errors.New("invalid input")
)

func ListWebhooksService(ctx context.Context, pq response.PageQuery, filters map[string]string) ([]*DTO, int64, error) {
	items, total, err := ListWebhooks(ctx, pq, filters)
	if err != nil {
		return nil, 0, err
	}
	result := make([]*DTO, 0, len(items))
	for i := range items {
		result = append(result, ToDTO(&items[i]))
	}
	return result, total, nil
}

func GetWebhookService(ctx context.Context, id string) (*DTO, error) {
	if id == "" {
		return nil, ErrInvalidInput
	}
	w, err := GetWebhookByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return ToDTO(w), nil
}

func CreateWebhookService(ctx context.Context, req CreateRequest) (*DTO, error) {
	name := strings.TrimSpace(req.Name)
	webhookURL := strings.TrimSpace(req.URL)
	if name == "" || webhookURL == "" {
		return nil, ErrInvalidInput
	}
	scope := strings.TrimSpace(req.Scope)
	if scope == "" {
		scope = ScopeGlobal
	}
	if scope != ScopeGlobal && scope != ScopeProject {
		return nil, ErrInvalidInput
	}

	w := &Webhook{
		Name:      name,
		Scope:     scope,
		ProjectID: req.ProjectID,
		URL:       webhookURL,
		Enabled:   req.Enabled,
		Events:    joinEvents(req.Events),
	}
	if err := CreateWebhookRepo(ctx, w); err != nil {
		return nil, err
	}
	return GetWebhookService(ctx, w.ID)
}

func UpdateWebhookService(ctx context.Context, id string, req UpdateRequest) (*DTO, error) {
	if id == "" {
		return nil, ErrInvalidInput
	}
	w, err := GetWebhookByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		w.Name = req.Name
	}
	if req.URL != "" {
		w.URL = req.URL
	}
	w.Enabled = req.Enabled
	if req.Events != nil {
		w.Events = joinEvents(req.Events)
	}

	if err := SaveWebhookRepo(ctx, w); err != nil {
		return nil, err
	}
	return GetWebhookService(ctx, w.ID)
}

func DeleteWebhookService(ctx context.Context, id string) error {
	if id == "" {
		return ErrInvalidInput
	}
	err := DeleteWebhookByID(ctx, id)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return ErrNotFound
	}
	return err
}

// SendWebhook sends an HTTP POST to all matching webhooks for the given event.

func SendWebhook(ctx context.Context, event string, payload interface{}) {
	webhooks, err := ListEnabledWebhooksByEvent(ctx, event)
	if err != nil {
		global.Log.Warn("list webhooks for event failed", zap.String("event", event), zap.Error(err))
		return
	}

	body := map[string]interface{}{
		"event":   event,
		"payload": payload,
		"time":    time.Now().Unix(),
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		global.Log.Warn("marshal webhook payload failed", zap.Error(err))
		return
	}

	for _, w := range webhooks {
		go postWebhookWithLog(w, event, jsonBody)
	}
}

func postWebhookWithLog(w Webhook, event string, jsonBody []byte) {
	start := time.Now()
	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	req, err := http.NewRequest(http.MethodPost, w.URL, bytes.NewReader(jsonBody))
	if err != nil {
		global.Log.Warn("create webhook request failed", zap.String("url", w.URL), zap.Error(err))
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Jerry-DB-Manager-Webhook/1.0")

	resp, err := client.Do(req)
	duration := int(time.Since(start).Milliseconds())

	log := &DeliveryLog{
		WebhookID:  w.ID,
		Event:      event,
		URL:        w.URL,
		DurationMs: duration,
	}

	if err != nil {
		log.Status = "failed"
		log.ErrorMsg = err.Error()
		global.Log.Warn("send webhook failed", zap.String("url", w.URL), zap.Error(err))
	} else {
		defer resp.Body.Close()
		log.StatusCode = resp.StatusCode
		if resp.StatusCode >= 400 {
			log.Status = "failed"
			log.ErrorMsg = fmt.Sprintf("HTTP %d", resp.StatusCode)
			global.Log.Warn("webhook returned error status",
				zap.String("url", w.URL),
				zap.Int("status", resp.StatusCode),
			)
		} else {
			log.Status = "success"
		}
	}

	// Record delivery log (best-effort, don't block)
	ctx := context.Background()
	if err := CreateDeliveryLog(ctx, log); err != nil {
		global.Log.Warn("save webhook delivery log failed", zap.Error(err))
	}
}
