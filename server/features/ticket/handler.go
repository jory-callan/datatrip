package ticket

import (
	"errors"
	"strconv"

	"czwlinux.cloud/go-friday-starter/features/project"
	"czwlinux.cloud/go-friday-starter/pkg/httpx"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"github.com/labstack/echo/v4"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) List(c echo.Context) error {
	var q ListQuery
	q.NeedCount = true
	if err := c.Bind(&q); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	if c.QueryParam("need_count") == "false" {
		q.NeedCount = false
	}
	q.Normalize()

	userID := httpx.CurrentUserID(c)
	items, total, err := ListTicketsForUser(c.Request().Context(), userID, q)
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.SuccessPage(c, items, total, q.Page, q.PageSize)
}

func (h *Handler) Detail(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		return response.BadRequest(c, "invalid id")
	}

	detail, err := GetTicketDetail(c.Request().Context(), uint(id))
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "ticket not found")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, detail)
}

func (h *Handler) Approve(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		return response.BadRequest(c, "invalid id")
	}

	var req ApproveRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}

	userID := httpx.CurrentUserID(c)
	t, err := ApproveTicket(c.Request().Context(), uint(id), userID, req.Comment)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "ticket not found")
	}
	if errors.Is(err, ErrForbidden) {
		return response.Forbidden(c, "forbidden: not an approver")
	}
	if errors.Is(err, ErrAlreadyActioned) {
		return response.BadRequest(c, "ticket already actioned")
	}
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, t)
}

func (h *Handler) Reject(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		return response.BadRequest(c, "invalid id")
	}

	var req ApproveRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}

	userID := httpx.CurrentUserID(c)
	t, err := RejectTicket(c.Request().Context(), uint(id), userID, req.Comment)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "ticket not found")
	}
	if errors.Is(err, ErrForbidden) {
		return response.Forbidden(c, "forbidden: not an approver")
	}
	if errors.Is(err, ErrAlreadyActioned) {
		return response.BadRequest(c, "ticket already actioned")
	}
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, t)
}

func (h *Handler) Create(c echo.Context) error {
	var req CreateTicketRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}

	userID := httpx.CurrentUserID(c)
	// Get approval mode from project
	proj, err := project.GetByID(c.Request().Context(), req.ProjectID)
	if err != nil {
		return response.BadRequest(c, "project not found")
	}
	if req.ApprovalMode == "" {
		req.ApprovalMode = proj.ApprovalMode
	}

	t, err := CreateTicket(c.Request().Context(), req.ProjectID, userID, req.Title, req.Description, req.SqlSnapshot, req.ApprovalMode)
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, t)
}

func (h *Handler) Urge(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		return response.BadRequest(c, "invalid id")
	}
	userID := httpx.CurrentUserID(c)
	t, err := UrgeTicket(c.Request().Context(), uint(id), userID)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "ticket not found")
	}
	if errors.Is(err, ErrForbidden) {
		return response.Forbidden(c, "only the applicant can urge")
	}
	if errors.Is(err, ErrAlreadyActioned) {
		return response.BadRequest(c, "ticket already actioned")
	}
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Ok(c, t)
}

func (h *Handler) Resubmit(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		return response.BadRequest(c, "invalid id")
	}
	var req CreateTicketRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	userID := httpx.CurrentUserID(c)
	t, err := ResubmitTicket(c.Request().Context(), uint(id), userID, req.Title, req.Description, req.SqlSnapshot)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "ticket not found")
	}
	if errors.Is(err, ErrForbidden) {
		return response.Forbidden(c, "only the applicant can resubmit")
	}
	if errors.Is(err, ErrAlreadyActioned) {
		return response.BadRequest(c, "only rejected tickets can be resubmitted")
	}
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, t)
}
