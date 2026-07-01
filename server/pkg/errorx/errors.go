package errorx

import "errors"

// 通用业务错误，service/repo 层可用 errors.Is 判断。
var (
	ErrNotFound           = errors.New("resource not found")
	ErrUnauthorized       = errors.New("unauthorized")
	ErrForbidden          = errors.New("forbidden")
	ErrBadRequest         = errors.New("bad request")
	ErrConflict           = errors.New("conflict")
	ErrInternalServer     = errors.New("internal server error")
	ErrInvalidCredentials = errors.New("invalid credentials")
)
