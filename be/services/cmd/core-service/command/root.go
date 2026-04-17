package command

import (
	"log"

	application "digisign-portal/services/app/core-service"
	"github.com/spf13/cobra"
)

func init() {
	log.SetFlags(log.LstdFlags | log.Lmicroseconds | log.Llongfile)
}

var cmdRoot = &cobra.Command{
	Use:   "core-service",
	Short: "core-service exposes Node parity API surface for phased migration.",
	Long:  "core-service exposes Node parity API surface for phased migration.",
	Run: func(cmd *cobra.Command, args []string) {
		app := application.New()
		if err := app.Init(); err != nil {
			log.Fatalf("Error in initializing the application: %+v", err)
			return
		}

		if err := app.Run(); err != nil {
			log.Fatalf("Error in running the application: %+v", err)
			return
		}
	},
}

func Execute() {
	if err := cmdRoot.Execute(); err != nil {
		log.Fatalf("Error in executing the root command: %+v", err)
	}
}
