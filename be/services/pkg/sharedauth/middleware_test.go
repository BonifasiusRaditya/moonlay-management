package sharedauth

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/labstack/echo/v4"
)

func TestAuthMiddlewareValidToken(t *testing.T) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("failed to generate key: %v", err)
	}

	jwks := map[string]any{
		"keys": []any{
			map[string]any{
				"kty": "RSA",
				"kid": "test-key",
				"alg": "RS256",
				"use": "sig",
				"n":   base64.RawURLEncoding.EncodeToString(privateKey.PublicKey.N.Bytes()),
				"e":   base64.RawURLEncoding.EncodeToString(bigIntToBytes(privateKey.PublicKey.E)),
			},
		},
	}

	jwksServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(jwks)
	}))
	defer jwksServer.Close()

	token := buildJWT(t, privateKey, "test-key", "issuer", "audience")

	e := echo.New()
	cfg := Config{
		JWKSURL:  jwksServer.URL,
		Issuer:   "issuer",
		Audience: "audience",
	}
	handler := AuthMiddleware(cfg)(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	if err := handler(ctx); err != nil {
		t.Fatalf("handler returned error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

func TestAuthMiddlewareMissingToken(t *testing.T) {
	e := echo.New()
	cfg := Config{}
	handler := AuthMiddleware(cfg)(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	if err := handler(ctx); err == nil {
		t.Fatalf("expected error for missing token")
	}
}

func buildJWT(t *testing.T, key *rsa.PrivateKey, kid string, issuer string, audience string) string {
	t.Helper()

	header := map[string]any{
		"alg": "RS256",
		"kid": kid,
		"typ": "JWT",
	}
	payload := map[string]any{
		"sub": "user-1",
		"iss": issuer,
		"aud": audience,
		"exp": time.Now().Add(5 * time.Minute).Unix(),
		"iat": time.Now().Unix(),
		"realm_access": map[string]any{
			"roles": []string{"portal_user"},
		},
	}

	headerBytes, _ := json.Marshal(header)
	payloadBytes, _ := json.Marshal(payload)
	encodedHeader := base64.RawURLEncoding.EncodeToString(headerBytes)
	encodedPayload := base64.RawURLEncoding.EncodeToString(payloadBytes)
	signingInput := encodedHeader + "." + encodedPayload

	hash := sha256.Sum256([]byte(signingInput))
	signature, err := rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, hash[:])
	if err != nil {
		t.Fatalf("sign error: %v", err)
	}

	return signingInput + "." + base64.RawURLEncoding.EncodeToString(signature)
}

func bigIntToBytes(val int) []byte {
	result := []byte{}
	for val > 0 {
		result = append([]byte{byte(val & 0xff)}, result...)
		val >>= 8
	}
	if len(result) == 0 {
		return []byte{0}
	}
	return result
}
