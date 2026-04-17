package command

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"golang.org/x/crypto/bcrypt"
)

var (
	migrateDatabaseURL string
	migrateSource      string
	loadConfigOnce     sync.Once
	migrateConfig      = map[string]string{}
)

var cmdMigrate = &cobra.Command{
	Use:   "migrate",
	Short: "Run database migrations",
	Long:  "Run database migrations with golang-migrate.",
}

var cmdMigrateUp = &cobra.Command{
	Use:   "up",
	Short: "Apply all available up migrations",
	RunE: func(cmd *cobra.Command, args []string) error {
		if err := validateSuperadminSeedConfig(); err != nil {
			return err
		}

		m, err := newMigrator()
		if err != nil {
			return err
		}
		defer closeMigrator(m)

		if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
			return err
		}

		fmt.Println("Migration up completed")
		return nil
	},
}

var cmdMigrateDown = &cobra.Command{
	Use:   "down",
	Short: "Rollback migrations",
	RunE: func(cmd *cobra.Command, args []string) error {
		all, _ := cmd.Flags().GetBool("all")
		steps, _ := cmd.Flags().GetInt("steps")

		if !all && steps <= 0 {
			return fmt.Errorf("steps must be greater than zero")
		}

		m, err := newMigrator()
		if err != nil {
			return err
		}
		defer closeMigrator(m)

		if all {
			err = m.Down()
		} else {
			err = m.Steps(-steps)
		}

		if err != nil && !errors.Is(err, migrate.ErrNoChange) {
			return err
		}

		fmt.Println("Migration down completed")
		return nil
	},
}

var cmdMigrateVersion = &cobra.Command{
	Use:   "version",
	Short: "Show current migration version",
	RunE: func(cmd *cobra.Command, args []string) error {
		m, err := newMigrator()
		if err != nil {
			return err
		}
		defer closeMigrator(m)

		version, dirty, err := m.Version()
		if errors.Is(err, migrate.ErrNilVersion) {
			fmt.Println("version: none")
			fmt.Println("dirty: false")
			return nil
		}
		if err != nil {
			return err
		}

		fmt.Printf("version: %d\n", version)
		fmt.Printf("dirty: %v\n", dirty)
		return nil
	},
}

var cmdMigrateForce = &cobra.Command{
	Use:   "force [version]",
	Short: "Set migration version without running SQL",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		version, err := strconv.Atoi(args[0])
		if err != nil {
			return fmt.Errorf("invalid version %q: %w", args[0], err)
		}

		m, err := newMigrator()
		if err != nil {
			return err
		}
		defer closeMigrator(m)

		if err := m.Force(version); err != nil {
			return err
		}

		fmt.Printf("Forced migration version to %d\n", version)
		return nil
	},
}

var cmdMigrateResetSuperadmin = &cobra.Command{
	Use:   "reset-superadmin",
	Short: "Reset or create default superadmin credentials",
	RunE: func(cmd *cobra.Command, args []string) error {
		if err := validateSuperadminSeedConfig(); err != nil {
			return err
		}

		databaseURL, err := resolveDatabaseURL()
		if err != nil {
			return err
		}

		db, err := sql.Open("postgres", databaseURL)
		if err != nil {
			return fmt.Errorf("open database: %w", err)
		}
		defer db.Close()

		ctx := context.Background()
		if err := db.PingContext(ctx); err != nil {
			return fmt.Errorf("ping database: %w", err)
		}

		email, password, _ := superadminSeedValues()
		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return fmt.Errorf("hash password: %w", err)
		}

		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			return fmt.Errorf("begin transaction: %w", err)
		}
		defer tx.Rollback()

		var userID int64
		err = tx.QueryRowContext(
			ctx,
			`SELECT id FROM users WHERE lower(email) = lower($1) AND deleted_at IS NULL ORDER BY id LIMIT 1`,
			email,
		).Scan(&userID)

		switch {
		case err == nil:
			if _, execErr := tx.ExecContext(
				ctx,
				`UPDATE users
				SET password_hash = $2,
				    must_change_password = true,
				    role = 'superadmin',
				    updated_at = now()
				WHERE id = $1`,
				userID,
				string(hash),
			); execErr != nil {
				return fmt.Errorf("update superadmin credentials: %w", execErr)
			}
			fmt.Printf("Reset password for existing superadmin account: %s\n", email)
		case errors.Is(err, sql.ErrNoRows):
			if _, execErr := tx.ExecContext(
				ctx,
				`INSERT INTO users (client_id, branch_id, name, email, password_hash, role, must_change_password)
				 VALUES (NULL, NULL, 'Super Admin', $1, $2, 'superadmin', true)`,
				email,
				string(hash),
			); execErr != nil {
				return fmt.Errorf("insert superadmin account: %w", execErr)
			}
			fmt.Printf("Created superadmin account: %s\n", email)
		default:
			return fmt.Errorf("query superadmin account: %w", err)
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("commit transaction: %w", err)
		}

		fmt.Println("Superadmin reset completed")
		return nil
	},
}

func init() {
	cmdRoot.AddCommand(cmdMigrate)

	cmdMigrate.PersistentFlags().StringVar(&migrateDatabaseURL, "database-url", "", "Postgres connection URL (or set DATABASE_URL/MIGRATE_DATABASE_URL)")
	cmdMigrate.PersistentFlags().StringVar(&migrateSource, "source", "file://migrations", "Migration source URL or path")

	cmdMigrateDown.Flags().Int("steps", 1, "Number of migrations to rollback")
	cmdMigrateDown.Flags().Bool("all", false, "Rollback all applied migrations")

	cmdMigrate.AddCommand(cmdMigrateUp)
	cmdMigrate.AddCommand(cmdMigrateDown)
	cmdMigrate.AddCommand(cmdMigrateVersion)
	cmdMigrate.AddCommand(cmdMigrateForce)
	cmdMigrate.AddCommand(cmdMigrateResetSuperadmin)
}

func newMigrator() (*migrate.Migrate, error) {
	databaseURL, err := resolveDatabaseURL()
	if err != nil {
		return nil, err
	}
	source := resolveMigrationSource(migrateSource)

	m, err := migrate.New(source, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("create migrator: %w", err)
	}

	return m, nil
}

func closeMigrator(m *migrate.Migrate) {
	sourceErr, dbErr := m.Close()
	if sourceErr != nil {
		fmt.Fprintf(os.Stderr, "warning: close migrate source: %v\n", sourceErr)
	}
	if dbErr != nil {
		fmt.Fprintf(os.Stderr, "warning: close migrate db: %v\n", dbErr)
	}
}

func resolveDatabaseURL() (string, error) {
	if migrateDatabaseURL != "" {
		return withSessionSettings(migrateDatabaseURL), nil
	}

	if v := lookupValue("MIGRATE_DATABASE_URL"); v != "" {
		return withSessionSettings(v), nil
	}
	if v := lookupValue("DATABASE_URL"); v != "" {
		return withSessionSettings(v), nil
	}

	host := lookupValue("DB_POSTGRES_HOST")
	port := lookupValue("DB_POSTGRES_PORT")
	user := lookupValue("DB_POSTGRES_USER")
	pass := lookupValue("DB_POSTGRES_PASSWORD")
	name := lookupValue("DB_POSTGRES_NAME")
	sslmode := lookupValue("DB_POSTGRES_SSLMODE")

	if sslmode == "" {
		sslmode = "disable"
	}
	if port == "" {
		port = "5432"
	}

	if host == "" || user == "" || name == "" {
		return "", fmt.Errorf("missing database URL: set --database-url or MIGRATE_DATABASE_URL/DATABASE_URL or DB_POSTGRES_* env vars")
	}

	u := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(user, pass),
		Host:   fmt.Sprintf("%s:%s", host, port),
		Path:   "/" + name,
	}
	q := u.Query()
	q.Set("sslmode", sslmode)
	u.RawQuery = q.Encode()

	return withSessionSettings(u.String()), nil
}

func withSessionSettings(databaseURL string) string {
	u, err := url.Parse(databaseURL)
	if err != nil {
		return databaseURL
	}

	email, password, resetPassword := superadminSeedValues()

	if email == "" && password == "" {
		return databaseURL
	}

	q := u.Query()
	optionParts := []string{}
	if existing := strings.TrimSpace(q.Get("options")); existing != "" {
		optionParts = append(optionParts, existing)
	}
	if email != "" {
		optionParts = append(optionParts, fmt.Sprintf("-c app.superadmin_email=%s", email))
	}
	if password != "" {
		optionParts = append(optionParts, fmt.Sprintf("-c app.superadmin_password=%s", password))
	}
	optionParts = append(optionParts, fmt.Sprintf("-c app.superadmin_reset_password=%t", resetPassword))

	q.Set("options", strings.Join(optionParts, " "))
	u.RawQuery = q.Encode()
	return u.String()
}

func validateSuperadminSeedConfig() error {
	email, password, _ := superadminSeedValues()
	if email != "" && password != "" {
		return nil
	}

	return fmt.Errorf(
		"missing superadmin seed configuration: set DEFAULT_SUPERADMIN_EMAIL and DEFAULT_SUPERADMIN_PASSWORD in .env/env before running migrate up",
	)
}

func superadminSeedValues() (string, string, bool) {
	email := strings.TrimSpace(lookupValue("DEFAULT_SUPERADMIN_EMAIL"))
	password := strings.TrimSpace(lookupValue("DEFAULT_SUPERADMIN_PASSWORD"))
	resetPassword := parseBoolFlag(lookupValue("DEFAULT_SUPERADMIN_RESET_PASSWORD"))

	return email, password, resetPassword
}

func parseBoolFlag(v string) bool {
	v = strings.TrimSpace(strings.ToLower(v))
	return v == "1" || v == "true" || v == "yes" || v == "y" || v == "on"
}

func lookupValue(key string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}

	loadConfigOnce.Do(loadMigrateConfigFromEnvFiles)
	return migrateConfig[key]
}

func loadMigrateConfigFromEnvFiles() {
	keys := []string{
		"MIGRATE_DATABASE_URL",
		"DATABASE_URL",
		"DB_POSTGRES_HOST",
		"DB_POSTGRES_PORT",
		"DB_POSTGRES_USER",
		"DB_POSTGRES_PASSWORD",
		"DB_POSTGRES_NAME",
		"DB_POSTGRES_SSLMODE",
		"DEFAULT_SUPERADMIN_EMAIL",
		"DEFAULT_SUPERADMIN_PASSWORD",
		"DEFAULT_SUPERADMIN_RESET_PASSWORD",
	}

	for _, cfgPath := range []string{".env", filepath.FromSlash("../.env")} {
		if _, err := os.Stat(cfgPath); err != nil {
			continue
		}

		vp := viper.New()
		vp.SetConfigFile(cfgPath)
		if err := vp.ReadInConfig(); err != nil {
			continue
		}

		for _, key := range keys {
			if migrateConfig[key] != "" {
				continue
			}
			if v := strings.TrimSpace(vp.GetString(key)); v != "" {
				migrateConfig[key] = v
			}
		}
	}
}

func resolveMigrationSource(source string) string {
	if source == "" {
		return "file://migrations"
	}
	if strings.HasPrefix(source, "file://") {
		return source
	}
	if strings.Contains(source, "://") {
		return source
	}

	clean := filepath.ToSlash(source)
	return "file://" + clean
}
