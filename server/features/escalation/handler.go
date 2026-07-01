package escalation

import (
	"errors"
	"strconv"

	"czwlinux.cloud/go-friday-starter/pkg/httpx"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"github.com/labstack/echo/v4"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) Create(c echo.Context) error {
	var req CreateRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}
	userID := httpx.CurrentUserID(c)

	e, err := CreateEscalation(c.Request().Context(), userID, req.ProjectID, req.Reason)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Ok(c, e)
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
	items, total, err := ListEscalations(c.Request().Context(), userID, q)
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.SuccessPage(c, items, total, q.Page, q.PageSize)
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
	e, err := ApproveEscalation(c.Request().Context(), uint(id), userID, req.Duration)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "escalation not found")
	}
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Ok(c, e)
}

func (h *Handler) Reject(c echo.Context) error {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		return response.BadRequest(c, "invalid id")
	}

	userID := httpx.CurrentUserID(c)
	e, err := RejectEscalation(c.Request().Context(), uint(id), userID)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "escalation not found")
	}
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Ok(c, e)
}

func (h *Handler) CheckActive(c echo.Context) error {
	projectID, err := strconv.ParseUint(c.QueryParam("project_id"), 10, 64)
	if err != nil || projectID == 0 {
		return response.BadRequest(c, "invalid project_id")
	}

	userID := httpx.CurrentUserID(c)
	resp, err := CheckActiveEscalation(c.Request().Context(), userID, uint(projectID))
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, resp)
}
