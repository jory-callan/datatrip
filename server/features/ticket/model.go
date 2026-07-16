package ticket

import (
	"time"

	"czwlinux.cloud/go-friday-starter/pkg/idutil"
	"gorm.io/gorm"
)

// Ticket status constants
const (
	StatusPending       = "pending"
	StatusApproved      = "approved"
	StatusRejected      = "rejected"
	StatusExecuting     = "executing"
	StatusExecuted      = "executed"
	StatusExecuteFailed = "execute_failed"
)

// Ticket 工单（SQL 执行申请）
type Ticket struct {
	ID              string         `gorm:"primaryKey;size:32" json:"id"`                          // 主键 UUID v7
	ProjectID       string         `gorm:"not null;index" json:"project_id"`                      // 所属项目 ID
	ApplicantID     string         `gorm:"not null;index" json:"applicant_id"`                    // 申请人用户 ID
	Title           string         `gorm:"size:256" json:"title"`                                 // 工单标题
	Description     string         `gorm:"type:text" json:"description"`                          // 工单描述
	InstructionJSON string         `gorm:"type:text;not null" json:"instruction_json"`            // JSON: []Instruction
	Status          string         `gorm:"size:32;not null;default:pending" json:"status"`        // 工单状态: pending-待审批, approved-已通过, rejected-已拒绝, executing-执行中, executed-已执行, execute_failed-执行失败
	ApprovalMode    string         `gorm:"size:32;not null;default:any_one" json:"approval_mode"` // 审批模式: any_one-任意一人通过, all-全部通过
	ExecutionStatus string         `gorm:"size:32" json:"execution_status"`                       // 执行结果: success-成功, failed-失败
	ExecutionError  string         `gorm:"type:text" json:"execution_error"`                      // 执行错误信息
	ExecutedAt      *time.Time     `json:"executed_at"`                                           // 执行时间
	CreatedAt       time.Time      `json:"created_at"`                                            // 创建时间
	UpdatedAt       time.Time      `json:"updated_at"`                                            // 更新时间
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`                                        // 软删除时间
}

// ApprovalRecord 审批记录
type ApprovalRecord struct {
	ID         string    `gorm:"primaryKey;size:32" json:"id"`      // 主键 UUID v7
	TicketID   string    `gorm:"not null;index" json:"ticket_id"`   // 关联工单 ID
	ApproverID string    `gorm:"not null;index" json:"approver_id"` // 审批人用户 ID
	Action     string    `gorm:"size:32;not null" json:"action"`    // 操作: approved-同意, rejected-拒绝, urged-催办
	Comment    string    `gorm:"type:text" json:"comment"`          // 审批意见
	CreatedAt  time.Time `json:"created_at"`                        // 创建时间
}

// BeforeCreate GORM 钩子，自动生成 UUID v7 主键
func (t *Ticket) BeforeCreate(tx *gorm.DB) error {
	if t.ID == "" {
		t.ID = idutil.ShortUUIDv7()
	}
	return nil
}

// TableName 返回带前缀的表名
func (Ticket) TableName() string {
	return "data_ticket"
}

// BeforeCreate GORM 钩子，自动生成 UUID v7 主键
func (a *ApprovalRecord) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = idutil.ShortUUIDv7()
	}
	return nil
}

// TableName 返回带前缀的表名
func (ApprovalRecord) TableName() string {
	return "data_approval_record"
}
