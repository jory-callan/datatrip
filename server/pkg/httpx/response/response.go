package response

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

const (
	CodeSuccess     = 0
	MaxPageSize     = 2000
	DefaultPageSize = 20
)

type CodeMessage struct {
	Code       int
	Msg        string
	HTTPStatus int
}

var (
	Success         = CodeMessage{Code: CodeSuccess, Msg: "success", HTTPStatus: http.StatusOK}
	InvalidParam    = CodeMessage{Code: http.StatusBadRequest, Msg: "invalid param", HTTPStatus: http.StatusBadRequest}
	UnauthorizedErr = CodeMessage{Code: http.StatusUnauthorized, Msg: "unauthorized", HTTPStatus: http.StatusUnauthorized}
	ForbiddenErr    = CodeMessage{Code: http.StatusForbidden, Msg: "forbidden", HTTPStatus: http.StatusForbidden}
	NotFoundErr     = CodeMessage{Code: http.StatusNotFound, Msg: "not found", HTTPStatus: http.StatusNotFound}
	ConflictErr     = CodeMessage{Code: http.StatusConflict, Msg: "conflict", HTTPStatus: http.StatusConflict}
	TooManyRequests = CodeMessage{Code: http.StatusTooManyRequests, Msg: "too many requests", HTTPStatus: http.StatusTooManyRequests}
	InternalErr     = CodeMessage{Code: http.StatusInternalServerError, Msg: "internal error", HTTPStatus: http.StatusInternalServerError}
)

type Response struct {
	Code      int    `json:"code"`
	Msg       string `json:"msg"`
	Data      any    `json:"data"`
	RequestID string `json:"request_id,omitempty"`
}

type PageData struct {
	List     any   `json:"list"`
	Total    int64 `json:"total"`
	Page     int   `json:"page"`
	PageSize int   `json:"page_size"`
}

type PageQuery struct {
	Page      int  `query:"page" json:"page"`
	PageSize  int  `query:"page_size" json:"page_size"`
	NeedCount bool `query:"need_count" json:"need_count"`
}

func (q *PageQuery) Normalize() {
	if q.Page <= 0 {
		q.Page = 1
	}
	if q.PageSize <= 0 {
		q.PageSize = DefaultPageSize
	}
	if q.PageSize > MaxPageSize {
		q.PageSize = MaxPageSize
	}
}

func (q PageQuery) Offset() int {
	page := q.Page
	if page <= 0 {
		page = 1
	}
	pageSize := q.PageSize
	if pageSize <= 0 {
		pageSize = DefaultPageSize
	}
	if pageSize > MaxPageSize {
		pageSize = MaxPageSize
	}
	return (page - 1) * pageSize
}

func requestID(c echo.Context) string {
	if c == nil || c.Response() == nil {
		return ""
	}
	return c.Response().Header().Get(echo.HeaderXRequestID)
}

func JSON(c echo.Context, status int, code int, msg string, data any) error {
	return c.JSON(status, Response{Code: code, Msg: msg, Data: data, RequestID: requestID(c)})
}

func JSONCode(c echo.Context, cm CodeMessage, data any) error {
	return JSON(c, cm.HTTPStatus, cm.Code, cm.Msg, data)
}

func ErrorCode(c echo.Context, cm CodeMessage) error {
	return JSONCode(c, cm, nil)
}

func Ok(c echo.Context, data any) error {
	return JSONCode(c, Success, data)
}

func OkWithMsg(c echo.Context, msg string, data any) error {
	return JSON(c, http.StatusOK, CodeSuccess, msg, data)
}

func Error(c echo.Context, status int, msg string) error {
	return JSON(c, status, status, msg, nil)
}

func BadRequest(c echo.Context, msg string) error {
	return Error(c, http.StatusBadRequest, msg)
}

func Unauthorized(c echo.Context, msg string) error {
	return Error(c, http.StatusUnauthorized, msg)
}

func Forbidden(c echo.Context, msg string) error {
	return Error(c, http.StatusForbidden, msg)
}

func NotFound(c echo.Context, msg string) error {
	return Error(c, http.StatusNotFound, msg)
}

func InternalError(c echo.Context, msg string) error {
	return Error(c, http.StatusInternalServerError, msg)
}

func SuccessPage(c echo.Context, list any, total int64, page, pageSize int) error {
	return Ok(c, PageData{List: list, Total: total, Page: page, PageSize: pageSize})
}

// ParseListQuery 从请求中解析分页参数并收集其余筛选参数。
// 返回：
//   - pq: 已 Normalize 的 PageQuery
//   - filters: 除 page/page_size/need_count 之外的所有 query 参数
//   - error: binding 失败时返回
//
// HandleList 内部使用时不再需要手写 NeedCount 默认值和 Normalize。
func ParseListQuery(c echo.Context) (pq PageQuery, filters map[string]string, err error) {
	pq.NeedCount = true
	if err := c.Bind(&pq); err != nil {
		return pq, nil, err
	}
	if c.QueryParam("need_count") == "false" {
		pq.NeedCount = false
	}
	pq.Normalize()

	filters = make(map[string]string)
	for k, vs := range c.QueryParams() {
		if k == "page" || k == "page_size" || k == "need_count" {
			continue
		}
		if len(vs) > 0 && vs[0] != "" {
			filters[k] = vs[0]
		}
	}
	return pq, filters, nil
}
