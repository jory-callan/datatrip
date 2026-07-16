package migrations

import (
	"czwlinux.cloud/go-friday-starter/features/audit"
	"czwlinux.cloud/go-friday-starter/features/datasource"
	"czwlinux.cloud/go-friday-starter/features/dsrule"
	"czwlinux.cloud/go-friday-starter/features/escalation"
	"czwlinux.cloud/go-friday-starter/features/exec"
	"czwlinux.cloud/go-friday-starter/features/permission"
	"czwlinux.cloud/go-friday-starter/features/project"
	"czwlinux.cloud/go-friday-starter/features/role"
	rolepermission "czwlinux.cloud/go-friday-starter/features/role_permission"
	"czwlinux.cloud/go-friday-starter/features/snippet"
	"czwlinux.cloud/go-friday-starter/features/ticket"
	"czwlinux.cloud/go-friday-starter/features/user"
	userrole "czwlinux.cloud/go-friday-starter/features/user_role"
	"czwlinux.cloud/go-friday-starter/features/webhook"
	"gorm.io/gorm"
)

func AutoMigrate(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	return db.AutoMigrate(
		&user.User{},
		&datasource.Datasource{},
		&project.DataProject{},
		&project.DataProjectMember{},
		&dsrule.DatasourceRule{},
		&exec.SqlExecution{},
		&snippet.Snippet{},
		&audit.AuditLog{},
		&ticket.Ticket{},
		&ticket.ApprovalRecord{},
		&webhook.Webhook{},
		&webhook.DeliveryLog{},
		&escalation.Escalation{},
		&permission.Permission{},
		&role.Role{},
		&userrole.UserRole{},
		&rolepermission.RolePermission{},
	)
}
