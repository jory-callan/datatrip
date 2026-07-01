package sqlexec

import "github.com/labstack/echo/v4"

func RegisterRoutes(g *echo.Group) {
	h := NewHandler()
	mh := NewMetaHandler()
	g.POST("/sql/execute", h.Execute)
	g.POST("/sql/execute/escalated", h.ExecuteEscalated)

	// Metadata browsing
	g.GET("/projects/:id/meta/databases", mh.ListDatabases)
	g.GET("/projects/:id/meta/tables", mh.ListTables)
}
