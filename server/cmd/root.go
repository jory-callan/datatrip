package cmd

import (
	"fmt"
	"os"

	"czwlinux.cloud/go-friday-starter/cmd/service"
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "srvadm",
	Short: "srvadm is a CLI tool for managing backend services",
	Long:  `srvadm provides commands to manage services, configs, logs, users, and system health.`,
}

func init() {
	rootCmd.AddCommand(service.Start)
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
