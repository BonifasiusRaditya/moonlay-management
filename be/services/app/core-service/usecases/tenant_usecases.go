package usecases

import (
	"crypto/rand"
	"errors"
	"fmt"
	"strings"

	"digisign-portal/services/app/core-service/models"
	"digisign-portal/services/app/core-service/repositories"

	"golang.org/x/crypto/bcrypt"
)

type ClientUsecase struct{ repo *repositories.ClientRepository; users *repositories.UserRepository; rbac *repositories.RBACRepository }
type BranchUsecase struct{ repo *repositories.BranchRepository; clients *repositories.ClientRepository }
type UserUsecase struct{ repo *repositories.UserRepository; clients *repositories.ClientRepository; branches *repositories.BranchRepository }
type RBACUsecase struct{ repo *repositories.RBACRepository; users *repositories.UserRepository }

func NewClientUsecase(repo *repositories.ClientRepository, users *repositories.UserRepository, rbac *repositories.RBACRepository) *ClientUsecase {
	return &ClientUsecase{repo: repo, users: users, rbac: rbac}
}
func NewBranchUsecase(repo *repositories.BranchRepository, clients *repositories.ClientRepository) *BranchUsecase {
	return &BranchUsecase{repo: repo, clients: clients}
}
func NewUserUsecase(repo *repositories.UserRepository, clients *repositories.ClientRepository, branches *repositories.BranchRepository) *UserUsecase {
	return &UserUsecase{repo: repo, clients: clients, branches: branches}
}
func NewRBACUsecase(repo *repositories.RBACRepository, users *repositories.UserRepository) *RBACUsecase {
	return &RBACUsecase{repo: repo, users: users}
}

func (u *ClientUsecase) List(actorClientID uint, actorRole string) ([]models.Client, error) {
	if actorRole == "superadmin" { return u.repo.FindAll(nil) }
	return u.repo.FindAll(&actorClientID)
}

func (u *ClientUsecase) Get(id uint, actorClientID uint, actorRole string) (*models.Client, error) {
	c, err := u.repo.FindByID(id)
	if err != nil || c == nil { return c, err }
	if actorRole != "superadmin" && c.ID != actorClientID { return nil, errors.New("forbidden") }
	return c, nil
}

func (u *ClientUsecase) Create(in models.CreateClientInput, actorRole string) (map[string]any, error) {
	if actorRole != "superadmin" { return nil, errors.New("forbidden") }
	if strings.TrimSpace(in.Name) == "" || strings.TrimSpace(in.Code) == "" { return nil, errors.New("name and code are required") }
	if existing, err := u.repo.FindByCode(in.Code); err != nil { return nil, err } else if existing != nil { return nil, errors.New("client with this code already exists") }
	client, err := u.repo.Create(in)
	if err != nil { return nil, err }

	if in.AdminEmail != nil && strings.TrimSpace(*in.AdminEmail) != "" {
		generated := false
		password := ""
		if in.AdminPassword == nil || strings.TrimSpace(*in.AdminPassword) == "" {
			generated = true
			password = generateTempPassword()
		} else {
			password = *in.AdminPassword
		}
		hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		role := "admin"
		name := fmt.Sprintf("%s Admin", client.Name)
		admin := &models.ManagedUser{ClientID: client.ID, Name: name, Email: strings.ToLower(strings.TrimSpace(*in.AdminEmail)), PasswordHash: string(hash), Role: role, MustChangePassword: generated}
		if err := u.users.Create(admin); err != nil { return nil, err }
		res := map[string]any{"client": client}
		if generated { res["admin_temporary_password"] = password }
		return res, nil
	}

	return map[string]any{"client": client}, nil
}

func (u *ClientUsecase) Update(id uint, in models.UpdateClientInput, actorClientID uint, actorRole string) (*models.Client, error) {
	c, err := u.repo.FindByID(id)
	if err != nil || c == nil { return nil, errors.New("client not found") }
	if actorRole != "superadmin" && c.ID != actorClientID { return nil, errors.New("forbidden") }
	if in.Code != nil {
		existing, err := u.repo.FindByCode(*in.Code)
		if err != nil { return nil, err }
		if existing != nil && existing.ID != c.ID { return nil, errors.New("client with this code already exists") }
	}
	return u.repo.Update(id, in)
}

func (u *ClientUsecase) Delete(id uint, actorRole string) error {
	if actorRole != "superadmin" { return errors.New("forbidden") }
	c, err := u.repo.FindByID(id)
	if err != nil { return err }
	if c == nil { return errors.New("client not found") }
	return u.repo.Delete(id)
}

func (u *BranchUsecase) List(actorClientID uint, actorRole string, requestedClientID *uint) ([]models.Branch, error) {
	if actorRole == "superadmin" { return u.repo.FindAll(requestedClientID) }
	return u.repo.FindAll(&actorClientID)
}

func (u *BranchUsecase) Get(id uint, actorClientID uint, actorRole string) (*models.Branch, error) {
	b, err := u.repo.FindByID(id)
	if err != nil || b == nil { return nil, errors.New("branch not found") }
	if actorRole != "superadmin" && b.ClientID != actorClientID { return nil, errors.New("forbidden") }
	return b, nil
}

func (u *BranchUsecase) Create(in models.CreateBranchInput, actorClientID uint, actorRole string) (*models.Branch, error) {
	if strings.TrimSpace(in.Name) == "" || strings.TrimSpace(in.Code) == "" || in.ClientID == 0 { return nil, errors.New("missing required fields") }
	if actorRole != "superadmin" { in.ClientID = actorClientID }
	if c, err := u.clients.FindByID(in.ClientID); err != nil { return nil, err } else if c == nil { return nil, errors.New("client not found") }
	return u.repo.Create(in)
}

func (u *BranchUsecase) Update(id uint, in models.UpdateBranchInput, actorClientID uint, actorRole string) (*models.Branch, error) {
	b, err := u.repo.FindByID(id)
	if err != nil || b == nil { return nil, errors.New("branch not found") }
	if actorRole != "superadmin" && b.ClientID != actorClientID { return nil, errors.New("forbidden") }
	if actorRole != "superadmin" { in.ClientID = &actorClientID }
	return u.repo.Update(id, in)
}

func (u *BranchUsecase) Delete(id uint, actorClientID uint, actorRole string) error {
	b, err := u.repo.FindByID(id)
	if err != nil { return err }
	if b == nil { return errors.New("branch not found") }
	if actorRole != "superadmin" && b.ClientID != actorClientID { return errors.New("forbidden") }
	return u.repo.Delete(id)
}

func (u *UserUsecase) List(actorClientID uint, actorRole string) ([]models.ManagedUser, error) {
	if actorRole == "superadmin" { return u.repo.FindAll(nil) }
	return u.repo.FindAll(&actorClientID)
}

func (u *UserUsecase) Get(id uint, actorClientID uint, actorRole string) (*models.ManagedUser, error) {
	item, err := u.repo.FindByID(id)
	if err != nil || item == nil { return nil, errors.New("user not found") }
	if actorRole != "superadmin" && item.ClientID != actorClientID { return nil, errors.New("forbidden") }
	return item, nil
}

func (u *UserUsecase) Create(in models.CreateUserInput, actorClientID uint, actorRole string) (map[string]any, error) {
	if strings.TrimSpace(in.Name) == "" || strings.TrimSpace(in.Email) == "" { return nil, errors.New("missing required fields") }
	if strings.TrimSpace(in.Role) == "" { in.Role = "staff" }
	if strings.ToLower(in.Role) == "superadmin" { return nil, errors.New("cannot create superadmin role via api") }
	if actorRole != "superadmin" { in.ClientID = actorClientID }
	if in.ClientID == 0 { return nil, errors.New("client_id is required") }
	if c, err := u.clients.FindByID(in.ClientID); err != nil { return nil, err } else if c == nil { return nil, errors.New("client not found") }
	if in.BranchID != nil && *in.BranchID > 0 {
		if b, err := u.branches.FindByID(*in.BranchID); err != nil { return nil, err } else if b == nil || b.ClientID != in.ClientID { return nil, errors.New("invalid branch") }
	}
	if existing, err := u.repo.FindByEmail(in.Email); err != nil { return nil, err } else if existing != nil { return nil, errors.New("user with this email already exists") }

	generated := false
	plain := ""
	if in.Password == nil || strings.TrimSpace(*in.Password) == "" {
		generated = true
		plain = generateTempPassword()
	} else {
		plain = *in.Password
	}
	if in.PasswordConfirmation != nil && strings.TrimSpace(*in.PasswordConfirmation) != "" && plain != *in.PasswordConfirmation { return nil, errors.New("passwords do not match") }
	hash, _ := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	user := &models.ManagedUser{ClientID: in.ClientID, BranchID: in.BranchID, Name: strings.TrimSpace(in.Name), Email: strings.ToLower(strings.TrimSpace(in.Email)), PasswordHash: string(hash), Role: in.Role, MustChangePassword: generated}
	if err := u.repo.Create(user); err != nil { return nil, err }
	res := map[string]any{"user": user}
	if generated { res["temporary_password"] = plain }
	return res, nil
}

func (u *UserUsecase) Update(id uint, in models.UpdateUserInput, actorClientID uint, actorRole string) (*models.ManagedUser, error) {
	item, err := u.repo.FindByID(id)
	if err != nil || item == nil { return nil, errors.New("user not found") }
	if actorRole != "superadmin" && item.ClientID != actorClientID { return nil, errors.New("forbidden") }
	updates := map[string]any{}
	if in.ClientID != nil {
		if actorRole != "superadmin" { return nil, errors.New("forbidden") }
		updates["client_id"] = *in.ClientID
	}
	if in.BranchID != nil { updates["branch_id"] = *in.BranchID }
	if in.Name != nil { updates["name"] = strings.TrimSpace(*in.Name) }
	if in.Email != nil {
		existing, err := u.repo.FindByEmail(*in.Email)
		if err != nil { return nil, err }
		if existing != nil && existing.ID != item.ID { return nil, errors.New("user with this email already exists") }
		updates["email"] = strings.ToLower(strings.TrimSpace(*in.Email))
	}
	if in.Role != nil {
		if strings.ToLower(strings.TrimSpace(*in.Role)) == "superadmin" { return nil, errors.New("cannot assign superadmin via api") }
		updates["role"] = strings.TrimSpace(*in.Role)
	}
	if in.MustChangePassword != nil { updates["must_change_password"] = *in.MustChangePassword }
	if in.Password != nil && strings.TrimSpace(*in.Password) != "" {
		if in.PasswordConfirmation != nil && *in.PasswordConfirmation != *in.Password { return nil, errors.New("passwords do not match") }
		hash, _ := bcrypt.GenerateFromPassword([]byte(*in.Password), bcrypt.DefaultCost)
		updates["password_hash"] = string(hash)
	}
	if err := u.repo.Update(id, updates); err != nil { return nil, err }
	return u.repo.FindByID(id)
}

func (u *UserUsecase) ChangePassword(targetUserID uint, actorUserID uint, actorRole string, input models.ChangePasswordInput) error {
	item, err := u.repo.FindByID(targetUserID)
	if err != nil { return err }
	if item == nil { return errors.New("user not found") }
	if actorRole != "superadmin" && actorRole != "admin" && actorUserID != targetUserID { return errors.New("forbidden") }
	if input.NewPassword != input.PasswordConfirmation { return errors.New("passwords do not match") }
	if actorRole != "superadmin" && actorRole != "admin" {
		if err := bcrypt.CompareHashAndPassword([]byte(item.PasswordHash), []byte(input.CurrentPassword)); err != nil {
			return errors.New("current password is incorrect")
		}
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	return u.repo.Update(targetUserID, map[string]any{"password_hash": string(hash), "must_change_password": false})
}

func (u *UserUsecase) Delete(id uint, actorClientID uint, actorRole string) error {
	item, err := u.repo.FindByID(id)
	if err != nil { return err }
	if item == nil { return errors.New("user not found") }
	if actorRole != "superadmin" && item.ClientID != actorClientID { return errors.New("forbidden") }
	return u.repo.Delete(id)
}

func (u *RBACUsecase) ListPermissions(includeHidden bool) ([]string, error) {
	rows, err := u.repo.ListPermissions(includeHidden)
	if err != nil { return nil, err }
	out := make([]string, 0, len(rows))
	for _, p := range rows { out = append(out, p.Key) }
	return out, nil
}

func (u *RBACUsecase) ListRoles(actorClientID uint, actorRole string) ([]models.Role, error) {
	if actorRole == "superadmin" {
		return u.repo.ListRoles(nil)
	}
	return u.repo.ListRoles(&actorClientID)
}

func (u *RBACUsecase) CreateRole(input models.CreateRoleInput, actorClientID uint, actorRole string) (*models.Role, error) {
	if strings.TrimSpace(input.Key) == "" || strings.TrimSpace(input.Name) == "" { return nil, errors.New("key and name are required") }
	if actorRole != "superadmin" { input.ClientID = &actorClientID }
	if existing, err := u.repo.FindRoleByKey(input.ClientID, input.Key); err != nil { return nil, err } else if existing != nil { return nil, errors.New("role key already exists for this client") }
	role := &models.Role{ClientID: input.ClientID, Key: strings.TrimSpace(input.Key), Name: strings.TrimSpace(input.Name), Description: input.Description}
	if err := u.repo.CreateRole(role); err != nil { return nil, err }
	return role, nil
}

func (u *RBACUsecase) UpdateRole(roleID uint, input models.UpdateRoleInput, actorClientID uint, actorRole string) (*models.Role, error) {
	role, err := u.repo.FindRoleByID(roleID)
	if err != nil || role == nil { return nil, errors.New("role not found") }
	if actorRole != "superadmin" {
		if role.ClientID == nil || *role.ClientID != actorClientID { return nil, errors.New("forbidden") }
	}
	updates := map[string]any{}
	if input.Key != nil {
		if existing, err := u.repo.FindRoleByKey(role.ClientID, *input.Key); err != nil { return nil, err } else if existing != nil && existing.ID != role.ID { return nil, errors.New("role key already exists for this client") }
		updates["key"] = strings.TrimSpace(*input.Key)
	}
	if input.Name != nil { updates["name"] = strings.TrimSpace(*input.Name) }
	if input.Description != nil { updates["description"] = input.Description }
	if err := u.repo.UpdateRole(roleID, updates); err != nil { return nil, err }
	return u.repo.FindRoleByID(roleID)
}

func (u *RBACUsecase) DeleteRole(roleID uint, actorClientID uint, actorRole string) error {
	role, err := u.repo.FindRoleByID(roleID)
	if err != nil { return err }
	if role == nil { return errors.New("role not found") }
	if actorRole != "superadmin" {
		if role.ClientID == nil || *role.ClientID != actorClientID { return errors.New("forbidden") }
	}
	return u.repo.DeleteRole(roleID)
}

func (u *RBACUsecase) GetRolePermissions(roleID uint, actorClientID uint, actorRole string) ([]string, error) {
	role, err := u.repo.FindRoleByID(roleID)
	if err != nil || role == nil { return nil, errors.New("role not found") }
	if actorRole != "superadmin" {
		if role.ClientID == nil || *role.ClientID != actorClientID { return nil, errors.New("forbidden") }
	}
	return u.repo.GetRolePermissionKeys(roleID)
}

func (u *RBACUsecase) SetRolePermissions(roleID uint, permissions []string, actorClientID uint, actorRole string) error {
	role, err := u.repo.FindRoleByID(roleID)
	if err != nil || role == nil { return errors.New("role not found") }
	if actorRole != "superadmin" {
		if role.ClientID == nil || *role.ClientID != actorClientID { return errors.New("forbidden") }
	}
	return u.repo.SetRolePermissions(roleID, permissions)
}

func (u *RBACUsecase) AssignRoleToUser(userID uint, roleKey string, actorClientID uint, actorRole string) error {
	if strings.ToLower(strings.TrimSpace(roleKey)) == "superadmin" { return errors.New("cannot assign superadmin via api") }
	user, err := u.users.FindByID(userID)
	if err != nil || user == nil { return errors.New("user not found") }
	if actorRole != "superadmin" && user.ClientID != actorClientID { return errors.New("forbidden") }

	targetClient := user.ClientID
	role, err := u.repo.FindRoleByKey(&targetClient, roleKey)
	if err != nil { return err }
	if role == nil { return errors.New("role not found for this client") }
	return u.users.Update(userID, map[string]any{"role": role.Key})
}

func generateTempPassword() string {
	buf := make([]byte, 12)
	if _, err := rand.Read(buf); err != nil { return "TempPass123!" }
	return fmt.Sprintf("Tmp-%x!", buf[:6])
}
