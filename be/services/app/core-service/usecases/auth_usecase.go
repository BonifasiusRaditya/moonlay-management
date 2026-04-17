package usecases

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"os"
	"strings"
	"time"

	"digisign-portal/services/app/core-service/models"
	"digisign-portal/services/app/core-service/repositories"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthUsecase struct {
	repo        *repositories.AuthRepository
	tokenSecret string
	tokenTTL    time.Duration
}

type TokenClaims struct {
	UserID   uint  `json:"user_id"`
	ClientID uint  `json:"client_id"`
	BranchID *uint `json:"branch_id"`
	Role     string `json:"role"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

func NewAuthUsecase(repo *repositories.AuthRepository) *AuthUsecase {
	secret := strings.TrimSpace(os.Getenv("JWT_SECRET"))
	if secret == "" {
		secret = "change-this-secret"
	}
	return &AuthUsecase{repo: repo, tokenSecret: secret, tokenTTL: 24 * time.Hour}
}

func (u *AuthUsecase) TokenSecret() string {
	return u.tokenSecret
}

func (u *AuthUsecase) Login(input models.LoginInput) (*models.AuthLoginResponse, error) {
	user, err := u.repo.FindUserByEmail(input.Email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	if err := u.repo.UpdateLastLogin(user.ID); err != nil {
		return nil, err
	}

	permissions, err := u.repo.PermissionsForUser(user.ID)
	if err != nil {
		return nil, err
	}

	token, err := u.issueToken(user)
	if err != nil {
		return nil, err
	}

	return &models.AuthLoginResponse{
		Token: token,
		User: models.AuthUserResponse{
			ID:                 user.ID,
			Email:              user.Email,
			Name:               user.Name,
			Role:               user.Role,
			ClientID:           user.ClientID,
			BranchID:           user.BranchID,
			MustChangePassword: user.MustChangePassword,
			Permissions:        permissions,
		},
	}, nil
}

func (u *AuthUsecase) Register(input models.RegisterInput) (*models.AuthLoginResponse, error) {
	if input.Password != input.PasswordConfirmation {
		return nil, errors.New("passwords do not match")
	}
	if strings.TrimSpace(input.Role) == "" {
		input.Role = "staff"
	}

	existing, err := u.repo.FindUserByEmail(input.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("user with this email already exists")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	user := &models.User{
		ClientID:           input.ClientID,
		BranchID:           input.BranchID,
		Name:               strings.TrimSpace(input.Name),
		Email:              strings.TrimSpace(strings.ToLower(input.Email)),
		PasswordHash:       string(hash),
		Role:               strings.TrimSpace(input.Role),
		MustChangePassword: false,
		LastLoginAt:        &now,
	}

	if err := u.repo.CreateUser(user); err != nil {
		return nil, err
	}

	permissions, err := u.repo.PermissionsForUser(user.ID)
	if err != nil {
		return nil, err
	}

	token, err := u.issueToken(user)
	if err != nil {
		return nil, err
	}

	return &models.AuthLoginResponse{
		Token: token,
		User: models.AuthUserResponse{
			ID:                 user.ID,
			Email:              user.Email,
			Name:               user.Name,
			Role:               user.Role,
			ClientID:           user.ClientID,
			BranchID:           user.BranchID,
			MustChangePassword: user.MustChangePassword,
			Permissions:        permissions,
		},
	}, nil
}

func (u *AuthUsecase) RefreshToken(tokenStr string) (string, error) {
	claims, err := u.ParseToken(tokenStr)
	if err != nil {
		return "", errors.New("invalid or expired token")
	}

	user, err := u.repo.FindUserByID(claims.UserID)
	if err != nil {
		return "", err
	}
	if user == nil {
		return "", errors.New("user not found")
	}

	return u.issueToken(user)
}

func (u *AuthUsecase) Me(userID uint) (*models.AuthUserResponse, error) {
	user, err := u.repo.FindUserByID(userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	permissions, err := u.repo.PermissionsForUser(user.ID)
	if err != nil {
		return nil, err
	}

	return &models.AuthUserResponse{
		ID:                 user.ID,
		Email:              user.Email,
		Name:               user.Name,
		Role:               user.Role,
		ClientID:           user.ClientID,
		BranchID:           user.BranchID,
		MustChangePassword: user.MustChangePassword,
		Permissions:        permissions,
	}, nil
}

func (u *AuthUsecase) ForgotPassword(input models.ForgotPasswordInput) error {
	user, err := u.repo.FindUserByEmail(input.Email)
	if err != nil {
		return err
	}
	if user == nil {
		return nil
	}

	tokenBuf := make([]byte, 32)
	if _, err := rand.Read(tokenBuf); err != nil {
		return err
	}
	token := hex.EncodeToString(tokenBuf)
	expiresAt := time.Now().UTC().Add(1 * time.Hour)
	return u.repo.CreatePasswordResetToken(&models.PasswordResetToken{UserID: user.ID, Token: token, ExpiresAt: expiresAt, Used: false})
}

func (u *AuthUsecase) ResetPassword(input models.ResetPasswordInput) error {
	if input.NewPassword != input.PasswordConfirmation {
		return errors.New("passwords do not match")
	}

	record, err := u.repo.FindActivePasswordResetToken(input.Token)
	if err != nil {
		return err
	}
	if record == nil {
		return errors.New("invalid or expired reset token")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	if err := u.repo.UpdatePassword(record.UserID, string(hash)); err != nil {
		return err
	}
	return u.repo.MarkPasswordResetTokenUsed(input.Token)
}

func (u *AuthUsecase) ParseToken(tokenStr string) (*TokenClaims, error) {
	claims := &TokenClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(u.tokenSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

func (u *AuthUsecase) issueToken(user *models.User) (string, error) {
	now := time.Now().UTC()
	claims := TokenClaims{
		UserID:   user.ID,
		ClientID: user.ClientID,
		BranchID: user.BranchID,
		Role:     user.Role,
		Email:    user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(u.tokenTTL)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(u.tokenSecret))
}
