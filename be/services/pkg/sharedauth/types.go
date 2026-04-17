package sharedauth

import (
	"net/http"
	"time"
)

type RealmAccess struct {
	Roles []string `json:"roles"`
}

type Claims struct {
	Subject     string      `json:"sub"`
	Issuer      string      `json:"iss"`
	Audience    interface{} `json:"aud"`
	ExpiresAt   int64       `json:"exp"`
	IssuedAt    int64       `json:"iat"`
	RealmAccess RealmAccess `json:"realm_access"`
}

func (c Claims) Roles() []string {
	return c.RealmAccess.Roles
}

type Config struct {
	JWKSURL       string
	Issuer        string
	Audience      string
	RequiredRoles []string
	CacheTTL      time.Duration
	HTTPClient    *http.Client
}

func (c Config) withDefaults() Config {
	if c.CacheTTL == 0 {
		c.CacheTTL = 5 * time.Minute
	}
	return c
}

func HasAnyRole(subjectRoles []string, required ...string) bool {
	if len(required) == 0 {
		return true
	}
	roleSet := make(map[string]struct{}, len(subjectRoles))
	for _, role := range subjectRoles {
		roleSet[role] = struct{}{}
	}
	for _, role := range required {
		if _, ok := roleSet[role]; ok {
			return true
		}
	}
	return false
}
