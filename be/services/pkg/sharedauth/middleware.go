package sharedauth

import (
	"context"
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
)

type jwtHeader struct {
	KeyID string `json:"kid"`
	Alg   string `json:"alg"`
}

func AuthMiddleware(cfg Config) echo.MiddlewareFunc {
	cfg = cfg.withDefaults()
	cache := NewJWKSCache(cfg.JWKSURL, cfg.CacheTTL, cfg.HTTPClient)

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			token, err := bearerToken(c.Request().Header.Get("Authorization"))
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
			}

			claims, err := ParseAndVerify(c.Request().Context(), token, cache, cfg.Issuer, cfg.Audience)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
			}

			if len(cfg.RequiredRoles) > 0 && !HasAnyRole(claims.Roles(), cfg.RequiredRoles...) {
				return echo.NewHTTPError(http.StatusForbidden, "forbidden")
			}

			c.Set("sub", claims.Subject)
			c.Set("roles", claims.Roles())
			c.Set("claims", claims)
			return next(c)
		}
	}
}

func RequireAnyRole(roles ...string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			rawRoles, ok := c.Get("roles").([]string)
			if !ok || !HasAnyRole(rawRoles, roles...) {
				return echo.NewHTTPError(http.StatusForbidden, "forbidden")
			}
			return next(c)
		}
	}
}

func ParseAndVerify(ctx context.Context, token string, keys KeyProvider, issuer string, audience string) (*Claims, error) {
	header, payload, sig, err := splitToken(token)
	if err != nil {
		return nil, err
	}

	var jwtHead jwtHeader
	if err := json.Unmarshal(header, &jwtHead); err != nil {
		return nil, errors.New("invalid jwt header")
	}
	if jwtHead.Alg != "RS256" {
		return nil, errors.New("unsupported jwt alg")
	}

	key, err := keys.GetPublicKey(ctx, jwtHead.KeyID)
	if err != nil {
		return nil, err
	}

	if err := verifySignature(token, key, sig); err != nil {
		return nil, err
	}

	var claims Claims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, errors.New("invalid jwt claims")
	}

	if issuer != "" && claims.Issuer != issuer {
		return nil, errors.New("invalid issuer")
	}
	if audience != "" && !hasAudience(claims.Audience, audience) {
		return nil, errors.New("invalid audience")
	}
	if claims.ExpiresAt != 0 && time.Now().Unix() > claims.ExpiresAt {
		return nil, errors.New("token expired")
	}

	return &claims, nil
}

func splitToken(token string) (header []byte, payload []byte, signature []byte, err error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, nil, nil, errors.New("invalid token format")
	}

	header, err = base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, nil, nil, errors.New("invalid header encoding")
	}

	payload, err = base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, nil, nil, errors.New("invalid payload encoding")
	}

	signature, err = base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return nil, nil, nil, errors.New("invalid signature encoding")
	}

	return header, payload, signature, nil
}

func verifySignature(token string, key *rsa.PublicKey, signature []byte) error {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return errors.New("invalid token format")
	}

	signingInput := parts[0] + "." + parts[1]
	hash := sha256.Sum256([]byte(signingInput))
	if err := rsa.VerifyPKCS1v15(key, crypto.SHA256, hash[:], signature); err != nil {
		return errors.New("invalid signature")
	}
	return nil
}

func hasAudience(raw interface{}, expected string) bool {
	switch aud := raw.(type) {
	case string:
		return aud == expected
	case []interface{}:
		for _, entry := range aud {
			if entryStr, ok := entry.(string); ok && entryStr == expected {
				return true
			}
		}
	case []string:
		for _, entry := range aud {
			if entry == expected {
				return true
			}
		}
	}
	return false
}

func bearerToken(authHeader string) (string, error) {
	if authHeader == "" {
		return "", errors.New("missing authorization header")
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", errors.New("invalid authorization header")
	}
	return strings.TrimSpace(parts[1]), nil
}
