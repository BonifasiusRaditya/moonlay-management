package command

import (
	"log"

	"github.com/spf13/cobra"

	application "digisign-portal/services/app/audit-service"
)

func init() {
	log.SetFlags(log.LstdFlags | log.Lmicroseconds | log.Llongfile)
}

var cmdRoot = &cobra.Command{
	Use:   "audit-service",
	Short: "audit-service handles audit event ingestion and query.",
	Long:  "audit-service handles audit event ingestion and query.",
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
