package authctx

import "github.com/labstack/echo/v4"

const CurrentUserIDKey = "user_id"

func SetUserID(c echo.Context, userID string) {
	if c == nil {
		return
	}
	c.Set(CurrentUserIDKey, userID)
}

func CurrentUserID(c echo.Context) (string, bool) {
	if c == nil {
		return "", false
	}
	v := c.Get(CurrentUserIDKey)
	switch id := v.(type) {
	case string:
		if id != "" {
			return id, true
		}
	}
	return "", false
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
