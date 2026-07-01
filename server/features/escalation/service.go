package escalation

import (
	"context"
	"errors"
	"fmt"
	"time"

	"czwlinux.cloud/go-friday-starter/features/project"
	"czwlinux.cloud/go-friday-starter/features/user"
	"czwlinux.cloud/go-friday-starter/features/webhook"
)

// CreateEscalation creates a new escalation request.
func CreateEscalation(ctx context.Context, userID, projectID uint, reason string) (*DTO, error) {
	if projectID == 0 || reason == "" {
		return nil, fmt.Errorf("invalid param")
	}

	// Default: 1 year from now (approver can shorten on approval)
	e := &Escalation{
		UserID:    userID,
		ProjectID: projectID,
		Reason:    reason,
		Status:    StatusPending,
		ExpiresAt: time.Now().Add(MaxDuration),
	}
	if err := Create(ctx, e); err != nil {
		return nil, err
	}
	webhook.SendWebhook(ctx, "escalation.created", map[string]interface{}{
		"escalation_id": e.ID,
		"user_id":       userID,
		"project_id":    projectID,
		"status":        e.Status,
	})
	return ToDTO(e), nil
}

// ApproveEscalation approves a pending escalation. Sets expiry to max 1 year from now.
// project_owner can self-approve.
func ApproveEscalation(ctx context.Context, escalationID, approverID uint, duration string) (*DTO, error) {
	e, err := GetByID(ctx, escalationID)
	if err != nil {
		return nil, err
	}
	if e.Status != StatusPending {
		return nil, fmt.Errorf("escalation already %s", e.Status)
	}

	// Check approver permissions: must be project_owner, system_admin, or the applicant themselves (self-approval)
	userRole := project.GetUserProjectRole(ctx, e.ProjectID, approverID)
	isProjectOwner := userRole == project.MemberRoleProjectOwner
	isSystemAdmin := false
	isApplicant := approverID == e.UserID

	u, err := user.GetByID(ctx, approverID)
	if err == nil {
		isSystemAdmin = u.IsSystemAdmin()
	}

	if !isProjectOwner && !isSystemAdmin && !isApplicant {
		return nil, fmt.Errorf("forbidden: only project owner or system admin can approve escalations, or self-approval")
	}

	// Calculate expiry
	expiresAt := time.Now().Add(MaxDuration) // default 1 year
	if duration != "" {
		d, parseErr := time.ParseDuration(duration)
		if parseErr == nil && d > 0 && d <= MaxDuration {
			expiresAt = time.Now().Add(d)
		}
	}

	e.Status = StatusApproved
	e.ExpiresAt = expiresAt
	e.ApprovedBy = &approverID
	now := time.Now()
	e.ApprovedAt = &now

	if err := Save(ctx, e); err != nil {
		return nil, err
	}
	webhook.SendWebhook(ctx, "escalation.approved", map[string]interface{}{
		"escalation_id": e.ID,
		"user_id":       e.UserID,
		"project_id":    e.ProjectID,
		"approved_by":   approverID,
		"expires_at":    e.ExpiresAt,
	})
	return ToDTO(e), nil
}

// RejectEscalation rejects a pending escalation.
func RejectEscalation(ctx context.Context, escalationID, approverID uint) (*DTO, error) {
	e, err := GetByID(ctx, escalationID)
	if err != nil {
		return nil, err
	}
	if e.Status != StatusPending {
		return nil, fmt.Errorf("escalation already %s", e.Status)
	}

	// Check approver permissions
	userRole := project.GetUserProjectRole(ctx, e.ProjectID, approverID)
	isProjectOwner := userRole == project.MemberRoleProjectOwner
	isSystemAdmin := false
	isApplicant := approverID == e.UserID

	u, err := user.GetByID(ctx, approverID)
	if err == nil {
		isSystemAdmin = u.IsSystemAdmin()
	}

	if !isProjectOwner && !isSystemAdmin && !isApplicant {
		return nil, fmt.Errorf("forbidden: only project owner or system admin can reject escalations, or self-rejection")
	}

	e.Status = StatusRejected
	e.RejectedBy = &approverID
	now := time.Now()
	e.RejectedAt = &now

	if err := Save(ctx, e); err != nil {
		return nil, err
	}
	webhook.SendWebhook(ctx, "escalation.rejected", map[string]interface{}{
		"escalation_id": e.ID,
		"user_id":       e.UserID,
		"project_id":    e.ProjectID,
		"rejected_by":   approverID,
	})
	return ToDTO(e), nil
}

// CheckActiveEscalation returns true if the user has an active (approved + not expired) escalation for the project.
func CheckActiveEscalation(ctx context.Context, userID, projectID uint) (*ActiveResponse, error) {
	e, err := GetActiveByUserAndProject(ctx, userID, projectID)
	if errors.Is(err, ErrNoActiveEscalation) {
		return &ActiveResponse{Active: false}, nil
	}
	if err != nil {
		return nil, err
	}
	return &ActiveResponse{
		Active:     true,
		Escalation: ToDTO(e),
		ExpiresAt:  e.ExpiresAt,
	}, nil
}

// ListEscalations lists escalations based on query.
func ListEscalations(ctx context.Context, userID uint, q ListQuery) ([]*DTO, int64, error) {
	items, total, err := ListByScope(ctx, userID, q)
	if err != nil {
		return nil, 0, err
	}
	result := make([]*DTO, 0, len(items))
	for i := range items {
		result = append(result, ToDTO(&items[i]))
	}
	return result, total, nil
}
