package migrations

import (
	"czwlinux.cloud/go-friday-starter/features/audit"
	"czwlinux.cloud/go-friday-starter/features/datasource"
	"czwlinux.cloud/go-friday-starter/features/dsrule"
	"czwlinux.cloud/go-friday-starter/features/escalation"
	"czwlinux.cloud/go-friday-starter/features/project"
	"czwlinux.cloud/go-friday-starter/features/sqlfavorite"
	"czwlinux.cloud/go-friday-starter/features/sqlexec"
	"czwlinux.cloud/go-friday-starter/features/ticket"
	"czwlinux.cloud/go-friday-starter/features/user"
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
		&project.DbProject{},
		&project.ProjectMember{},
		&dsrule.DatasourceRule{},
		&sqlexec.SqlExecution{},
		&sqlfavorite.SqlFavorite{},
		&audit.AuditLog{},
		&ticket.Ticket{},
		&ticket.ApprovalRecord{},
		&webhook.Webhook{},
		&webhook.DeliveryLog{},
		&escalation.Escalation{},
	)
}
