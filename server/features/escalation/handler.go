package escalation

import (
	"errors"

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
	pq, filters, err := response.ParseListQuery(c)
	if err != nil {
		return response.BadRequest(c, "invalid param")
	}

	userID := httpx.CurrentUserID(c)
	items, total, err := ListEscalations(c.Request().Context(), userID, pq, filters)
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.SuccessPage(c, items, total, pq.Page, pq.PageSize)
}

func (h *Handler) Approve(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return response.BadRequest(c, "invalid id")
	}

	var req ApproveRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}

	userID := httpx.CurrentUserID(c)
	e, err := ApproveEscalation(c.Request().Context(), id, userID, req.Duration)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "escalation not found")
	}
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Ok(c, e)
}

func (h *Handler) Reject(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return response.BadRequest(c, "invalid id")
	}

	userID := httpx.CurrentUserID(c)
	e, err := RejectEscalation(c.Request().Context(), id, userID)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "escalation not found")
	}
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Ok(c, e)
}

func (h *Handler) Update(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return response.BadRequest(c, "invalid id")
	}

	var req UpdateRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}

	userID := httpx.CurrentUserID(c)
	e, err := UpdateEscalation(c.Request().Context(), id, userID, req)
	if errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "escalation not found")
	}
	if errors.Is(err, ErrForbidden) {
		return response.Forbidden(c, "forbidden")
	}
	if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	}
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, e)
}

func (h *Handler) Delete(c echo.Context) error {
	id := c.Param("id")
	if id == "" {
		return response.BadRequest(c, "invalid id")
	}

	userID := httpx.CurrentUserID(c)
	if err := DeleteEscalation(c.Request().Context(), id, userID); errors.Is(err, ErrNotFound) {
		return response.NotFound(c, "escalation not found")
	} else if errors.Is(err, ErrForbidden) {
		return response.Forbidden(c, "forbidden")
	} else if errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	} else if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, nil)
}

func (h *Handler) BatchDelete(c echo.Context) error {
	var req BatchDeleteRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}

	userID := httpx.CurrentUserID(c)
	if err := BatchDeleteEscalations(c.Request().Context(), userID, req.IDs); errors.Is(err, ErrInvalidInput) {
		return response.BadRequest(c, "invalid param")
	} else if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, nil)
}

func (h *Handler) CheckActive(c echo.Context) error {
	projectID := c.QueryParam("project_id")
	if projectID == "" {
		return response.BadRequest(c, "invalid project_id")
	}
	userID := httpx.CurrentUserID(c)
	resp, err := CheckActiveEscalation(c.Request().Context(), userID, projectID)
	if err != nil {
		return response.InternalError(c, "internal error")
	}
	return response.Ok(c, resp)
}
