package exec

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
	if userID == "" {
		return response.Unauthorized(c, "unauthorized")
	}

	result, err := Execute(c.Request().Context(), userID, req)
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
		// 执行错误（SQL 语法错误、Redis 命令错误等）— 返回 400 + 数据库原始错误，不是 500
		if strings.Contains(errMsg, "query failed") ||
			strings.Contains(errMsg, "redis command failed") ||
			strings.Contains(errMsg, "mongo command failed") ||
			strings.Contains(errMsg, "es request") {
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
	if userID == "" {
		return response.Unauthorized(c, "unauthorized")
	}

	result, err := ExecuteEscalated(c.Request().Context(), userID, req)
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
		// 执行错误（SQL 语法错误等）— 返回 400 + 原始错误
		if strings.Contains(errMsg, "execution failed") ||
			strings.Contains(errMsg, "redis command failed") ||
			strings.Contains(errMsg, "mongo command failed") ||
			strings.Contains(errMsg, "es request") {
			return response.BadRequest(c, errMsg)
		}
		global.Log.Warn("execute_escalated: unhandled error", zap.String("request_id", c.Response().Header().Get("X-Request-ID")), zap.String("error", errMsg))
		return response.InternalError(c, "internal error")
	}

	return response.Ok(c, result)
}
