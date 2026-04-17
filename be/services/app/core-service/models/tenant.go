package models

import "time"

type Client struct {
	ID        uint       `gorm:"column:id;primaryKey" json:"id"`
	Name      string     `gorm:"column:name" json:"name"`
	Code      string     `gorm:"column:code" json:"code"`
	Address   *string    `gorm:"column:address" json:"address"`
	Phone     *string    `gorm:"column:phone" json:"phone"`
	Email     *string    `gorm:"column:email" json:"email"`
	Country   *string    `gorm:"column:country" json:"country"`
	CreatedAt time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at" json:"updated_at"`
	DeletedAt *time.Time `gorm:"column:deleted_at" json:"-"`
}

func (Client) TableName() string {
	return "clients"
}

type Branch struct {
	ID        uint       `gorm:"column:id;primaryKey" json:"id"`
	ClientID  uint       `gorm:"column:client_id" json:"client_id"`
	Name      string     `gorm:"column:name" json:"name"`
	Code      string     `gorm:"column:code" json:"code"`
	Address   *string    `gorm:"column:address" json:"address"`
	City      *string    `gorm:"column:city" json:"city"`
	Country   *string    `gorm:"column:country" json:"country"`
	Timezone  *string    `gorm:"column:timezone" json:"timezone"`
	CreatedAt time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at" json:"updated_at"`
	DeletedAt *time.Time `gorm:"column:deleted_at" json:"-"`
}

func (Branch) TableName() string {
	return "branches"
}

type ManagedUser struct {
	ID                 uint       `gorm:"column:id;primaryKey" json:"id"`
	ClientID           uint       `gorm:"column:client_id" json:"client_id"`
	BranchID           *uint      `gorm:"column:branch_id" json:"branch_id"`
	Name               string     `gorm:"column:name" json:"name"`
	Email              string     `gorm:"column:email" json:"email"`
	PasswordHash       string     `gorm:"column:password_hash" json:"-"`
	Role               string     `gorm:"column:role" json:"role"`
	LastLoginAt        *time.Time `gorm:"column:last_login_at" json:"last_login_at"`
	MustChangePassword bool       `gorm:"column:must_change_password" json:"must_change_password"`
	CreatedAt          time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt          time.Time  `gorm:"column:updated_at" json:"updated_at"`
	DeletedAt          *time.Time `gorm:"column:deleted_at" json:"-"`
}

func (ManagedUser) TableName() string {
	return "users"
}

type Permission struct {
	ID          uint       `gorm:"column:id;primaryKey" json:"id"`
	Key         string     `gorm:"column:key" json:"key"`
	Description *string    `gorm:"column:description" json:"description"`
	IsHidden    bool       `gorm:"column:is_hidden" json:"is_hidden"`
	DeletedAt   *time.Time `gorm:"column:deleted_at" json:"-"`
}

func (Permission) TableName() string {
	return "permissions"
}

type Role struct {
	ID          uint       `gorm:"column:id;primaryKey" json:"id"`
	ClientID    *uint      `gorm:"column:client_id" json:"client_id"`
	Key         string     `gorm:"column:key" json:"key"`
	Name        string     `gorm:"column:name" json:"name"`
	Description *string    `gorm:"column:description" json:"description"`
	CreatedAt   time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"column:updated_at" json:"updated_at"`
	DeletedAt   *time.Time `gorm:"column:deleted_at" json:"-"`
}

func (Role) TableName() string {
	return "roles"
}

type CreateClientInput struct {
	Name          string  `json:"name"`
	Code          string  `json:"code"`
	Address       *string `json:"address"`
	Phone         *string `json:"phone"`
	Email         *string `json:"email"`
	Country       *string `json:"country"`
	AdminEmail    *string `json:"admin_email"`
	AdminPassword *string `json:"admin_password"`
}

type UpdateClientInput struct {
	Name    *string `json:"name"`
	Code    *string `json:"code"`
	Address *string `json:"address"`
	Phone   *string `json:"phone"`
	Email   *string `json:"email"`
	Country *string `json:"country"`
}

type CreateBranchInput struct {
	ClientID uint    `json:"client_id"`
	Name     string  `json:"name"`
	Code     string  `json:"code"`
	Address  *string `json:"address"`
	City     *string `json:"city"`
	Country  *string `json:"country"`
	Timezone *string `json:"timezone"`
}

type UpdateBranchInput struct {
	ClientID *uint   `json:"client_id"`
	Name     *string `json:"name"`
	Code     *string `json:"code"`
	Address  *string `json:"address"`
	City     *string `json:"city"`
	Country  *string `json:"country"`
	Timezone *string `json:"timezone"`
}

type CreateUserInput struct {
	ClientID             uint    `json:"client_id"`
	BranchID             *uint   `json:"branch_id"`
	Name                 string  `json:"name"`
	Email                string  `json:"email"`
	Password             *string `json:"password"`
	PasswordConfirmation *string `json:"password_confirmation"`
	Role                 string  `json:"role"`
}

type UpdateUserInput struct {
	ClientID           *uint   `json:"client_id"`
	BranchID           *uint   `json:"branch_id"`
	Name               *string `json:"name"`
	Email              *string `json:"email"`
	Password           *string `json:"password"`
	PasswordConfirmation *string `json:"password_confirmation"`
	Role               *string `json:"role"`
	MustChangePassword *bool   `json:"must_change_password"`
}

type ChangePasswordInput struct {
	CurrentPassword      string `json:"current_password"`
	NewPassword          string `json:"new_password"`
	PasswordConfirmation string `json:"password_confirmation"`
}

type CreateRoleInput struct {
	ClientID    *uint   `json:"client_id"`
	Key         string  `json:"key"`
	Name        string  `json:"name"`
	Description *string `json:"description"`
}

type UpdateRoleInput struct {
	Key         *string `json:"key"`
	Name        *string `json:"name"`
	Description *string `json:"description"`
}

type SetRolePermissionsInput struct {
	Permissions []string `json:"permissions"`
}

type AssignRoleInput struct {
	Role string `json:"role"`
}

type Employee struct {
	ID        uint       `gorm:"column:id;primaryKey" json:"id"`
	Name      string     `gorm:"column:name" json:"name"`
	Email     string     `gorm:"column:email" json:"email"`
	ClientID  uint       `gorm:"column:client_id" json:"client_id"`
	BranchID  *uint      `gorm:"column:branch_id" json:"branch_id"`
	Status    string     `gorm:"column:status" json:"status"`
	CreatedAt time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt time.Time  `gorm:"column:updated_at" json:"updated_at"`
	DeletedAt *time.Time `gorm:"column:deleted_at" json:"-"`
}

func (Employee) TableName() string {
	return "employees"
}

type CreateEmployeeInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	ClientID uint   `json:"client_id"`
	BranchID *uint  `json:"branch_id"`
	Status   string `json:"status"`
}

type UpdateEmployeeInput struct {
	Name     *string `json:"name"`
	Email    *string `json:"email"`
	ClientID *uint   `json:"client_id"`
	BranchID *uint   `json:"branch_id"`
	Status   *string `json:"status"`
}

type ApiKey struct {
	ID         uint       `gorm:"column:id;primaryKey" json:"id"`
	ClientID   uint       `gorm:"column:client_id" json:"client_id"`
	KeyHash    string     `gorm:"column:key_hash" json:"-"`
	KeyPrefix  string     `gorm:"column:key_prefix" json:"key_prefix"`
	Name       *string    `gorm:"column:name" json:"name"`
	ExpiresAt  *time.Time `gorm:"column:expires_at" json:"expires_at"`
	IsActive   bool       `gorm:"column:is_active" json:"is_active"`
	LastUsedAt *time.Time `gorm:"column:last_used_at" json:"last_used_at"`
	CreatedBy  *uint      `gorm:"column:created_by" json:"created_by"`
	CreatedAt  time.Time  `gorm:"column:created_at" json:"created_at"`
	UpdatedAt  time.Time  `gorm:"column:updated_at" json:"updated_at"`
	DeletedAt  *time.Time `gorm:"column:deleted_at" json:"-"`
}

func (ApiKey) TableName() string {
	return "api_keys"
}

type CreateApiKeyInput struct {
	ClientID  uint       `json:"client_id"`
	Name      *string    `json:"name"`
	ExpiresAt *time.Time `json:"expires_at"`
}

type UpdateApiKeyInput struct {
	Name      *string    `json:"name"`
	ExpiresAt *time.Time `json:"expires_at"`
	IsActive  *bool      `json:"is_active"`
}

type AuditLog struct {
	ID        uint       `gorm:"column:id;primaryKey" json:"id"`
	ClientID  uint       `gorm:"column:client_id" json:"client_id"`
	UserID    uint       `gorm:"column:user_id" json:"user_id"`
	Action    string     `gorm:"column:action" json:"action"`
	Table     string     `gorm:"column:table_name" json:"table_name"`
	RecordID  uint       `gorm:"column:record_id" json:"record_id"`
	OldValue  *string    `gorm:"column:old_value" json:"old_value"`
	NewValue  *string    `gorm:"column:new_value" json:"new_value"`
	CreatedAt time.Time  `gorm:"column:created_at" json:"created_at"`
}

func (AuditLog) TableName() string {
	return "audit_logs"
}
