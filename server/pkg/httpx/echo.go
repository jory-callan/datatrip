package httpx

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"sort"
	"text/tabwriter"

	"czwlinux.cloud/go-friday-starter/pkg/logger"
	"github.com/labstack/echo-contrib/echoprometheus"
	"github.com/labstack/echo/v4"
	echoMiddleware "github.com/labstack/echo/v4/middleware"
)

// New 创建 Echo 服务器，并注册基础中间件。
func New(cfg *Config, log *logger.Logger, health ...HealthChecker) *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true
	e.Debug = cfg.EnableDebug

	e.Server.ReadTimeout = cfg.ReadTimeout
	e.Server.WriteTimeout = cfg.WriteTimeout
	e.Server.IdleTimeout = cfg.IdleTimeout
	e.Server.MaxHeaderBytes = cfg.MaxHeaderBytes

	registerMiddleware(e, cfg, log)
	registerHealthRoutes(e, health...)

	return e
}

type HealthChecker struct {
	DB *sql.DB
}

func registerHealthRoutes(e *echo.Echo, health ...HealthChecker) {
	e.GET("/ping", func(c echo.Context) error {
		return c.String(http.StatusOK, "pong")
	})

	e.GET("/healthz", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	e.GET("/readyz", func(c echo.Context) error {
		if len(health) == 0 || health[0].DB == nil {
			return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
		}
		if err := health[0].DB.PingContext(c.Request().Context()); err != nil {
			return c.JSON(http.StatusServiceUnavailable, map[string]string{"status": "unavailable"})
		}
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})
}

func registerMiddleware(e *echo.Echo, cfg *Config, log *logger.Logger) {
	e.Use(echoMiddleware.RequestID())
	if cfg.Metrics.Enabled {
		metricsPath := cfg.Metrics.Path
		if metricsPath == "" {
			metricsPath = "/metrics"
		}
		e.Use(echoprometheus.NewMiddleware("app"))
		e.GET(metricsPath, echoprometheus.NewHandler())
	}

	e.Use(Recover(log))
	e.Use(Logger(log))
	e.Use(CORS(cfg.CORS))
	e.Use(RateLimit(cfg.RateLimit))

	e.HTTPErrorHandler = ErrorHandler(log)
}

func PrintRoutes(e *echo.Echo) {
	routes := e.Routes()
	sort.Slice(routes, func(i, j int) bool {
		if routes[i].Path != routes[j].Path {
			return routes[i].Path < routes[j].Path
		}
		return routes[i].Method < routes[j].Method
	})

	w := tabwriter.NewWriter(os.Stdout, 0, 8, 1, ' ', tabwriter.Debug)
	fmt.Fprintln(w, "\n [ROUTE TABLE]")
	fmt.Fprintln(w, " METHOD\t PATH\t HANDLER")
	fmt.Fprintln(w, " ------\t ----\t -------")
	for _, r := range routes {
		fmt.Fprintf(w, " %s\t %s\t %s\n", r.Method, r.Path, r.Name)
	}
	w.Flush()
	fmt.Println()
}
