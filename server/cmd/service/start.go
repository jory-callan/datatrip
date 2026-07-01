package service

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"czwlinux.cloud/go-friday-starter/global"
	"czwlinux.cloud/go-friday-starter/migrations"
	"czwlinux.cloud/go-friday-starter/pkg/dbpool"
	"czwlinux.cloud/go-friday-starter/pkg/httpx"
	"czwlinux.cloud/go-friday-starter/routes"
	"czwlinux.cloud/go-friday-starter/seeds"
	"github.com/spf13/cobra"
	"go.uber.org/zap"
)

var configFile string

var Start = &cobra.Command{
	Use:   "start",
	Short: "Start backend service",
	Run: func(cmd *cobra.Command, args []string) {
		ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
		defer stop()

		global.MustInit(configFile)
		if err := migrations.AutoMigrate(global.DB); err != nil {
			global.Log.Error("database migration failed", zap.Error(err))
			os.Exit(1)
		}
		if err := seeds.Seed(global.DB); err != nil {
			global.Log.Error("database seed failed", zap.Error(err))
			os.Exit(1)
		}
		routes.Register(global.Engine)
		httpx.PrintRoutes(global.Engine)
		dbpool.StartReaper()

		addr := global.Addr()
		serverErr := make(chan error, 1)
		go func() {
			serverErr <- global.Engine.Start(addr)
		}()
		global.Log.Info("server started", zap.String("addr", addr))

		select {
		case <-ctx.Done():
		case err := <-serverErr:
			if err != nil && !errors.Is(err, http.ErrServerClosed) {
				global.Log.Error("server failed", zap.Error(err))
				os.Exit(1)
			}
		}

		shutdownCtx, cancel := context.WithTimeout(context.Background(), global.Cfg.HTTP.ShutdownTimeout)
		defer cancel()
		if err := global.Shutdown(shutdownCtx); err != nil {
			global.Log.Error("server shutdown failed", zap.Error(err))
			os.Exit(1)
		}
		global.Log.Info("server stopped")
	},
}

func init() {
	Start.Flags().StringVarP(&configFile, "config", "c", "", "config file path")
}
