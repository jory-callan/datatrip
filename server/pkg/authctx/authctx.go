package authctx

import "github.com/labstack/echo/v4"

const CurrentUserIDKey = "user_id"

func SetUserID(c echo.Context, userID uint) {
	if c == nil {
		return
	}
	c.Set(CurrentUserIDKey, userID)
}

func CurrentUserID(c echo.Context) (uint, bool) {
	if c == nil {
		return 0, false
	}
	v := c.Get(CurrentUserIDKey)
	switch id := v.(type) {
	case uint:
		return id, id > 0
	case uint64:
		if id > 0 {
			return uint(id), true
		}
	case int:
		if id > 0 {
			return uint(id), true
		}
	}
	return 0, false
}

// RequireAuth returns an Echo middleware that rejects unauthenticated requests.
func RequireAuth() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			_, ok := CurrentUserID(c)
			if !ok {
				return echo.ErrUnauthorized
			}
			return next(c)
		}
	}
}
