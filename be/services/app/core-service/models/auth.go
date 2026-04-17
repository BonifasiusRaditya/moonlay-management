package models

import "time"

type User struct {
	ID                 uint       `gorm:"column:id;primaryKey"`
	ClientID           uint       `gorm:"column:client_id"`
	BranchID           *uint      `gorm:"column:branch_id"`
	Name               string     `gorm:"column:name"`
	Email              string     `gorm:"column:email"`
	PasswordHash       string     `gorm:"column:password_hash"`
	Role               string     `gorm:"column:role"`
	LastLoginAt        *time.Time `gorm:"column:last_login_at"`
	MustChangePassword bool       `gorm:"column:must_change_password"`
	DeletedAt          *time.Time `gorm:"column:deleted_at"`
}

func (User) TableName() string {
	return "users"
}

type PasswordResetToken struct {
	ID        uint      `gorm:"column:id;primaryKey"`
	UserID    uint      `gorm:"column:user_id"`
	Token     string    `gorm:"column:token"`
	ExpiresAt time.Time `gorm:"column:expires_at"`
	Used      bool      `gorm:"column:used"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (PasswordResetToken) TableName() string {
	return "password_reset_tokens"
}

type RegisterInput struct {
	ClientID             uint   `json:"client_id"`
	BranchID             *uint  `json:"branch_id"`
	Name                 string `json:"name"`
	Email                string `json:"email"`
	Password             string `json:"password"`
	PasswordConfirmation string `json:"password_confirmation"`
	Role                 string `json:"role"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RefreshTokenInput struct {
	Token string `json:"token"`
}

type ForgotPasswordInput struct {
	Email string `json:"email"`
}

type ResetPasswordInput struct {
	Token                string `json:"token"`
	NewPassword          string `json:"new_password"`
	PasswordConfirmation string `json:"password_confirmation"`
}

type AuthUserResponse struct {
	ID                 uint     `json:"id"`
	Email              string   `json:"email"`
	Name               string   `json:"name"`
	Role               string   `json:"role"`
	ClientID           uint     `json:"client_id"`
	BranchID           *uint    `json:"branch_id"`
	MustChangePassword bool     `json:"must_change_password"`
	Permissions        []string `json:"permissions"`
}

type AuthLoginResponse struct {
	Token string           `json:"token"`
	User  AuthUserResponse `json:"user"`
}
