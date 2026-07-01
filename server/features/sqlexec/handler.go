package sqlexec

import (
	"strings"

	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/pkg/httpx"
	"czwlinux.cloud/go-friday-starter/pkg/httpx/response"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) Execute(c echo.Context) error {
	var req ExecuteRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}

	userID := httpx.CurrentUserID(c)
	if userID == 0 {
		return response.Unauthorized(c, "unauthorized")
	}

	result, err := ExecuteSQL(c.Request().Context(), userID, req)
	if err != nil {
		errMsg := err.Error()
		if strings.Contains(errMsg, "invalid param") {
			return response.BadRequest(c, errMsg)
		}
		if strings.Contains(errMsg, "not found") {
			return response.NotFound(c, errMsg)
		}
		if strings.Contains(errMsg, "forbidden") {
			return response.Forbidden(c, errMsg)
		}
		if strings.Contains(errMsg, "dangerous") {
			return response.Forbidden(c, errMsg)
		}
		if strings.Contains(errMsg, "rejected") || strings.Contains(errMsg, "unrecognizable") || strings.Contains(errMsg, "拒绝") {
			return response.Forbidden(c, errMsg)
		}
		if strings.Contains(errMsg, "配置") {
			return response.BadRequest(c, errMsg)
		}
		global.Log.Warn("execute: unhandled error", zap.String("request_id", c.Response().Header().Get("X-Request-ID")), zap.String("error", errMsg))
		return response.InternalError(c, "internal error")
	}

	return response.Ok(c, result)
}

func (h *Handler) ExecuteEscalated(c echo.Context) error {
	var req ExecuteRequest
	if err := c.Bind(&req); err != nil {
		return response.BadRequest(c, "invalid param")
	}

	userID := httpx.CurrentUserID(c)
	if userID == 0 {
		return response.Unauthorized(c, "unauthorized")
	}

	result, err := ExecuteEscalatedSQL(c.Request().Context(), userID, req)
	if err != nil {
		errMsg := err.Error()
		if strings.Contains(errMsg, "invalid param") {
			return response.BadRequest(c, errMsg)
		}
		if strings.Contains(errMsg, "not found") {
			return response.NotFound(c, errMsg)
		}
		if strings.Contains(errMsg, "forbidden") {
			return response.Forbidden(c, errMsg)
		}
		if strings.Contains(errMsg, "dangerous") {
			return response.Forbidden(c, errMsg)
		}
		if strings.Contains(errMsg, "提权") {
			return response.Forbidden(c, errMsg)
		}
		global.Log.Warn("execute_escalated: unhandled error", zap.String("request_id", c.Response().Header().Get("X-Request-ID")), zap.String("error", errMsg))
		return response.InternalError(c, "internal error")
	}

	return response.Ok(c, result)
}
