package audit

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/idutil"
	"gorm.io/gorm"
)

const (
	StatusPending  = "pending"
	StatusRunning  = "running"
	StatusSuccess  = "success"
	StatusFailed   = "failed"
	StatusRejected = "rejected"
)

// AuditLog 操作审计日志
type AuditLog struct {
	ID              string    `gorm:"primaryKey;size:32" json:"id"`                   // 主键 UUID v7
	ActorID         string    `gorm:"not null;index" json:"actor_id"`                 // 操作人用户 ID
	ProjectID       string    `gorm:"index" json:"project_id"`                        // 关联项目 ID（可选）
	DatasourceID    string    `gorm:"index" json:"datasource_id"`                     // 关联数据源 ID（可选）
	Action          string    `gorm:"size:64;not null" json:"action"`                 // 操作类型
	RawText         string    `gorm:"type:text" json:"raw_text"`                      // 原始输入文本（可搜索）
	InstructionJSON string    `gorm:"type:text" json:"instruction_json"`              // JSON: []Instruction（结构化展示）
	Classification  string    `gorm:"size:64" json:"classification"`                  // 分类: read / write / dangerous / unknown
	Status          string    `gorm:"size:32;not null;default:pending" json:"status"` // 执行状态
	DurationMs      int       `gorm:"default:0" json:"duration_ms"`                   // 执行耗时（毫秒）
	ErrorMessage    string    `gorm:"type:text" json:"error_message"`                 // 错误信息
	TicketID        string    `gorm:"default:0" json:"ticket_id"`                     // 关联工单 ID（可选）
	IP              string    `gorm:"size:64" json:"ip"`                              // 请求来源 IP
	CreatedAt       time.Time `json:"created_at"`                                     // 创建时间
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = idutil.ShortUUIDv7()
	}
	return nil
}

// TableName 返回带前缀的表名
func (AuditLog) TableName() string {
	return "data_audit_log"
}
